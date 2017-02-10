using AH.Control.Api.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.Standard
{
    public class IndexViewModel
    {
        public IndexStandard[] List { get; set; }
    }

    public class IndexStandard
    {
        public string StandardId { get; set; }
        public string Name { get; set; }
        public StandardType Type { get; set; }
        public int ModuleCount { get; set; }
    }
}