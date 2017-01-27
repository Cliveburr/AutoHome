using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AH.Control.Api.Database;

namespace AH.Control.Api.Entities
{
    public class AutoHomeDatabase : Database.Database
    {
        public Table<ModuleEntity> Module { get; private set; }

        public AutoHomeDatabase(IConnection conn)
            : base("AutoHome", conn)
        {
            Module = new Table<ModuleEntity>("Module", this);
            conn.Check();
            Initialize();
        }

        public override void InitializeTables()
        {
            Module.Initialize();
        }
    }
}
