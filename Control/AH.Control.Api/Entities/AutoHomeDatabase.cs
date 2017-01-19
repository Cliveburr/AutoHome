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

        public AutoHomeDatabase(Connection conn)
            : base("AutoHome", conn)
        {
        }
    }
}
