using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.Area
{
    public class IndexViewModel
    {
        public IndexArea[] List { get; set; }
    }

    public class IndexArea
    {
        public string AreaId { get; set; }
        public string Name { get; set; }
        public int ModuleCount { get; set; }
    }
}