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
        public Table<StandardEntity> Standard { get; private set; }
        public Table<AreaEntity> Area { get; private set; }
        public Table<ModuleVersionEntity> ModuleVersion { get; private set; }

        public AutoHomeDatabase(IConnection conn)
            : base("AutoHome", conn)
        {
            Module = new Table<ModuleEntity>("Module", this);
            Standard = new Table<StandardEntity>("Standard", this);
            Area = new Table<AreaEntity>("Area", this);
            ModuleVersion = new Table<ModuleVersionEntity>("ModuleVersion", this);
            conn.Check();
            Initialize();
        }

        public override void InitializeTables()
        {
            Module.Initialize();
            Standard.Initialize();
            Area.Initialize();
            ModuleVersion.Initialize();
        }
    }
}
