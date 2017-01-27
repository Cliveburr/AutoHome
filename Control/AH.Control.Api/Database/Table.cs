using RethinkDb.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Database
{
    public class Table<T>
    {
        public string Name { get; private set; }
        public IDatabase Database { get; private set; }

        public Table(string name, Database db)
        {
            Name = name;
            Database = db;
        }

        public void Initialize()
        {
            if (!Exist())
                Create();
        }

        private RethinkDb.Driver.Ast.Db Db
        {
            get
            {
                return RethinkDB.R.Db(Database.Name);
            }
        }

        public bool Exist()
        {
            var has = (Db.TableList()
                .Run(Database.Conection.Conn) as Newtonsoft.Json.Linq.JArray)
                .Where(name => name.ToString() == Name)
                .FirstOrDefault();
            return has != null;
        }

        public void Create()
        {
            Db.TableCreate(Name)
                .Run(Database.Conection.Conn);
        }

        public T Get(string id)
        {
            return Db.Table(Name)
                .Get(id)
                .Run<T>(Database.Conection.Conn);
        }

        public IEnumerable<T> GetAll()
        {
            var a = Db.Table(Name)
                .RunCursor<T>(Database.Conection.Conn);
            return a;
        }

        public IEnumerable<T> Filter(object expre)
        {
            return Db.Table(Name)
                .Filter(expre)
                .RunCursor<T>(Database.Conection.Conn);
        }

        public string Create(T entity)
        {
            var ret = Db.Table(Name)
                .Insert(entity)
                .RunResult(Database.Conection.Conn);

            if (ret.Inserted > 0)
                return ret.GeneratedKeys.First().ToString();
            else
                return string.Empty;
        }

        public string Update(string id, T entity)
        {
            var ret = Db.Table(Name)
                .Get(id)
                .Update(entity)
                .RunResult(Database.Conection.Conn);

            if (ret.Replaced > 0)
                return id;
            else
                return string.Empty;
        }

        public string Delete(string id)
        {
            var ret = Db.Table(Name)
                .Get(id)
                .Delete()
                .RunResult(Database.Conection.Conn);

            if (ret.Deleted > 0)
                return id;
            else
                return string.Empty;
        }
    }
}