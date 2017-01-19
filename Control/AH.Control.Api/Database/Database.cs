using RethinkDb.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Database
{
    public class Database
    {
        public Connection Conn { get; private set; }
        public string Name { get; private set; }
        public RethinkDb.Driver.Ast.Db Db { get; private set; }

        public Database(string name, Connection conn)
        {
            Name = name;
            Conn = conn;
        }

        public void Check()
        {
            try
            {
                Conn.Check();
            }
            catch
            {
                Db = null;
                throw;
            }

            if (Db == null)
            {
                if (!Exist())
                    Create();

                Db = RethinkDB.R.Db(Name)
                    .Run(Conn.Conn);
            }
        }

        public bool Exist()
        {
            var has = (RethinkDB.R.DbList()
                .Run(Conn.Conn) as Newtonsoft.Json.Linq.JArray)
                .Where(name => name.ToString() == Name)
                .FirstOrDefault();
            return has != null;
        }

        public void Create()
        {
            RethinkDB.R.DbCreate(Name)
                .Run(Conn.Conn);
        }
    }
}