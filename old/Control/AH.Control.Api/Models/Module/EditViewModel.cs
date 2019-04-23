using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.Module
{
    public class EditViewModel
    {
        public string ModuleId { get; set; }
        public ushort UID { get; set; }
        public string Alias { get; set; }
    }
}