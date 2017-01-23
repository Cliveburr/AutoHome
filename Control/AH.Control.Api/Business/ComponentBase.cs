using AH.Control.Api.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Business
{
    public class ComponentBase
    {
        public AutoHomeDatabase Db { get; private set; }

        public ComponentBase(AutoHomeDatabase db)
        {
            Db = db;
        }
    }
}