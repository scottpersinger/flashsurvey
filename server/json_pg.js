var $pg = require('pg');

// Tables: "select * from pg_tables where schemaname = 'public'""

JSONPG = {
  $tables: [],
  $db : null,
  $schemas : {},
  $schema : "public",

  handle_result: function(err, result, callback, query) {
    if (query) {
      err = "Error in query '" + query + "': " + err;
    }
    if (callback) {
      callback(err, result);
    } else if (err) {
      console.log("ERROR: ", err);
    } else {
      console.log(result);
    }
  },

  make_collection: function(table) {
    var thedb = this;
    this[table] = {
      find: function(where, callback) {
        return thedb.find(table, where, callback);
      },
      create: function(document, callback) {
        return thedb.create(table, document, callback);
      },
      insert: function(document, callback) {
        return thedb.create(table, document, callback);
      }
    }
  },

  // Schemas list query: "select nspname from pg_catalog.pg_namespace"
  connect: function(url, use_schema, callback) {
    if (typeof(use_schema) == "function") {
      callback = use_schema;
      use_schema = "public";
    }
    this.$schema = use_schema;
    var self = this;

    $pg.connect(url, function(err, client) {
      if (err) {
       console.error("Connection error: " + err);
       callback(err, null);
      } else {
        self.$db = client;
        self.$db.query("select table_name from information_schema.tables " +
          " where table_schema='" + self.$schema + "'", function(err, result) {
          if (err) {
            return console.error(err);
          } 
          for (var i = 0; i < result.rows.length; i++) {
            self.$tables.push(result.rows[i].table_name);
            self.make_collection(result.rows[i].table_name)
          }
          if (callback) {
            callback(null, self);
          }
        });
      }
    });
  },

  tables: function() {
    return this.$tables;
  },

  table_schema: function (table, callback) {
    var key = this.$schema + "." + table;
    if (this.$schemas[key] != undefined) {
      return callback(null, this.$schemas[key]);
    }

    var q = "select attname,format_type(atttypid,atttypmod) from pg_attribute " +
             "where attrelid = '" + this.$schema + "." + table + "'::regclass and attnum > 0 order by attnum";
    //console.log(q);

    var self = this;

    this.$db.query(q, function(err, result) {
      if (err) {
        callback(err, null);
      } else {
        if (result.rows.length == 0) {
          return callback("Table does not exist", null);
        }
        var cols = {}, order = [];
        for (var i = 0; i < result.rows.length; i++) {
          cols[result.rows[i].attname] = result.rows[i].format_type;
          order.push(result.rows[i].attname);
        }
        self.$schemas[key] = {'columns':cols, 'order':order};
        self.handle_result(null, self.$schemas[key], callback);
      }
    })
  },

  foreign_keys: function(table, callback) {
    var self = this;
    var q = "SELECT \
      tc.constraint_name, tc.table_name, kcu.column_name, \
      ccu.table_name AS foreign_table_name, \
      ccu.column_name AS foreign_column_name \
      FROM \
      information_schema.table_constraints AS tc \
      JOIN information_schema.key_column_usage AS kcu \
        ON tc.constraint_name = kcu.constraint_name \
      JOIN information_schema.constraint_column_usage AS ccu \
        ON ccu.constraint_name = tc.constraint_name \
      WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='" + table + "';"
      this.$db.query(q, function(err, result) {
        if (err) {
          callback(err, null);
        } else {
          self.$foreign_keys[table] = result.rows;
        }
      });
  },

  infer_type: function (value) {
    if (value == null) {
      return "varchar(20)";
    } else {
      if (typeof(value) == "object") {
        return "json";
      } else if (typeof(value) == "number") {
        if (Math.floor(value) == value) {
          return "integer";
        } else {
          return "float";
        }
      } else if (typeof(value) == "string") {
        value = value.trim();
        var time = Date.parse(value);
        if (value.match(/\d{0,4}-\d{0,2}-\d{0,2}/) && time > 0 && !Number.isNaN(time.toString())) {
          return "timestamp";
        } else if (value.toLocaleLowerCase() == "true" || value.toLocaleLowerCase() == "false") {
          return "boolean";
        } else {
          var length = Math.max(value.length, 255);
          return "varchar(" + length + ")";
        }
      }
    }
  },

  define_table: function(table, document, callback) {
    var self = this;
    this.table_schema(table, function(err, schema) {
      if (err) {
        var cols = [];
        cols.push("id bigserial primary key");
        for (k in document) {
          cols.push(k + " " + self.infer_type(document[k]));
        }
        var q = "CREATE schema IF NOT EXISTS " + self.$schema + ";" +
                "CREATE TABLE " + self.$schema + "." + table + " (" +
                cols.join(",") + ")";
        console.log(q);
        self.$db.query(q, function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            self.table_schema(table, callback);
          }
        });
      } else {
        self.handle_result(null, schema, callback);
      }
    })
  },

  must_quote: function(schema, column) {
    var type = schema[column];
    if (type == undefined) {
      console.log("Couldn't find '" + column + "' in " + JSON.stringify(schema));
    } else {
      return (type.indexOf("char") != -1 || type.indexOf("timestamp") != -1 || type.indexOf("json") != -1);
    }
  },

  add_column: function(table, column, document, callback) {
    var self = this;
    var type = this.infer_type(document[column]);
    var q = "ALTER TABLE " + this.$schema + "." + table + " " +
            "ADD COLUMN \"" + column + "\" " + type;
    console.log(q);
    self.$db.query(q, function(err, result) {
      if (!err) {
        var key = self.$schema + "." + table;
        self.$schemas[key].order.push(column);
        self.$schemas[key].columns[column] = type;
      }
      callback(err, result);
    });
  },

  create: function(table, document, callback) {
    var self = this;
    this.define_table(table, document, function(err, schema) {
      if (err) {
        return self.handle_result(err, null, callback);
      } else {
        var cols = [];
        values = [];
        var holders = [];
        schema = schema.columns;
        var index = 1;
        for (k in document) {
          cols.push(k);
          if (schema[k] == undefined) {
            self.add_column(table, k, document, function(err, result) {
              if (err) {
                return self.handle_result(err, result, callback);
              } else {
                return self.create(table, document, callback);
              }
            });
            return;
          }
          holders.push('$' + index);
          index++;
          if (self.must_quote(schema, k)) {
            if (schema[k].indexOf("json") != -1) {
              values.push(JSON.stringify(document[k]));
            } else {
              values.push(document[k]);
            }
          } else if (schema[k] == 'boolean') {
            values.push(document[k] == true || document[k] == 'true');
          } else {
            values.push(document[k]);
          }
        }
        var q = "WITH t AS (INSERT INTO  " + self.$schema + "." + table + " (" + cols.join(",") +
                ") VALUES (" + holders.join(",") + ")) " +
                " SELECT MAX(id) as id from " + self.$schema + "." + table;
        self.$db.query(q, values, function(err, result) {
          if (err) {
            self.handle_result(err, null, callback, q);
          } else {
            if (result && result.rows && result.rows.length > 0) {
              document.id = result.rows[0].id;
            }
            self.handle_result(err, document, callback);
          }
        });
      }
    });
  },

  where_clause: function(schema, where_doc) {
    if (!where_doc) {
      return "";
    }
    var clauses = [];
    for (k in where_doc) {
      var parts = this.parse_where_column(k);
      col = parts[0];
      op = parts[1];
      value = where_doc[k];
      if (value == null) {
        op = "is";
      }
      if (value != null && this.must_quote(schema.columns, col)) {
        clauses.push(col + " " + op + " " + "'" + value + "'");
      } else {
        clauses.push(col + " " + op + " " + where_doc[k]);
      }
      return "WHERE " + clauses.join(" AND ");
    }
  },

  join_clause: function(table, options) {
    if (!options) {
      return null;
    }
    if (options.one) {
      related = options.one;
      return {select: related + ".*", 
        join: "INNER JOIN " + related + " on " + table + "." + related + "_id = " + related + ".id"};
    }
  },

  parse_where_column: function(k) {
    var exprs = [/(.*)\s*(!=)/,/(.*)\s+(like)/,/(.*)(=)$/];
    for (i in exprs) {
      m = k.match(exprs[i]);
      if (m) {
        return m.slice(1)
      }
    }
    return [k, "="];
  },

  find: function(table, where_doc, options, callback) {
    if (typeof(options) == "function" && !callback) {
      callback = options;
      options = null;
    }
    if (typeof(where_doc) == "function" && !callback) {
      callback = where_doc;
      where_doc = null;
    }
    var self = this;
    this.table_schema(table, function(err, schema) {
      if (err) {
        // Assume table does not exist
        return self.handle_result(null, [], callback);
      } else {
        var clause = self.where_clause(schema, where_doc);
        var selects = [table + ".*"];
        console.log("Options: ", options);
        var joins = self.join_clause(options);
        var joinclause = "";
        if (joins) {
          selects.push(joins.select);
          joinclause = joins.join;
        }
        var q = "select " + selects.join(",") + " from " + self.$schema + "." + table + 
          joinclause + " " + clause;
        console.log(q);
        self.$db.query(q, function(err, result) {
          if (err) {
            self.handle_result(err, null, callback);
          } else {
            self.handle_result(err, result.rows, callback);
          }
        });
      }
    })   
  }
};

module.exports = JSONPG
