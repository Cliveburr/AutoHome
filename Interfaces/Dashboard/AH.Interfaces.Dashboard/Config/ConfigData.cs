using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.Config
{
    [Serializable]
    public class ConfigData
    {
        public string User1FilePath { get; set; }
        public string User2FilePath { get; set; }

        public void InitializeData()
        {
        }
    }
}