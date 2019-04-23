using RethinkDb.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Database
{
    public interface IDatabase
    {
        IConnection Conection { get; }
        string Name { get; }
        bool Exist();
        void Create();
    }

    public abstract class Database : IDatabase
    {
        public IConnection Conection { get; private set; }
        public string Name { get; private set; }

        public Database(string name, IConnection conn)
        {
            Name = name;
            Conection = conn;
        }

        public void Initialize()
        {
            if (!Exist())
                Create();

            InitializeTables();
        }

        public abstract void InitializeTables();

        public bool Exist()
        {
            var has = (RethinkDB.R.DbList()
                .Run(Conection.Conn) as Newtonsoft.Json.Linq.JArray)
                .Where(name => name.ToString() == Name)
                .FirstOrDefault();
            return has != null;
        }

        public void Create()
        {
            RethinkDB.R.DbCreate(Name)
                .Run(Conection.Conn);
        }
    }
}