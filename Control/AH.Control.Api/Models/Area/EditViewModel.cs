using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.Area
{
    public class EditViewModel
    {
        public string AreaId { get; set; }
        public string Name { get; set; }
        public EditModule[] Belong { get; set; }
        public EditModule[] Avaliable { get; set; }
    }

    public class EditModule
    {
        public string ModuleId { get; set; }
        public string Alias { get; set; }
    }
}