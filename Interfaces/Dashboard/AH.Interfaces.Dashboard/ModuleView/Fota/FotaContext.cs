using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.ModuleView.Fota
{
    public class FotaContext : BaseContext
    {
        public string User1bin { get; set; }
        public string User2bin { get; set; }
        public string NextUser { get; set; }
        public bool HasSelected { get; set; }
    }
}