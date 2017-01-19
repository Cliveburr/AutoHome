using RethinkDb.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Database
{
    public class Table<T>
    {
        public RethinkDb.Driver.Ast.Table Tbl { get; private set; }
        public string Name { get; private set; }
        public Database Db { get; private set; }

        public Table(string name, Database db)
        {
            Name = name;
            Db = db;
        }

        public void Check()
        {
            try
            {
                Db.Check();
            }
            catch
            {
                Tbl = null;
                throw;
            }

            if (Tbl == null)
            {
                if (!Exist())
                    Create();

                Tbl = Db.Db.Table(Name)
                    .Run(Db.Conn.Conn);
            }
        }

        public bool Exist()
        {
            var has = (Db.Db.TableList()
                .Run(Db.Conn.Conn) as Newtonsoft.Json.Linq.JArray)
                .Where(name => name.ToString() == Name)
                .FirstOrDefault();
            return has != null;
        }

        public void Create()
        {
            Db.Db.TableCreate(Name)
                .Run(Db.Conn.Conn);
        }

        public object Get()
        {
            Check();
            return null;
        }


    }
}