using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.Main.HomeProject
{
    public class HomeImageDescriptionSettings
    {
        public int GlobalMargin { get; set; }
        public List<HomeImageDescriptionSettingsArea> Childs { get; set; }
    }

    public class HomeImageDescriptionSettingsArea
    {
        public byte UID { get; set; }
        public string Name { get; set; }
        public string Image { get; set; }
        public int Red { get; set; }
        public int Blue { get; set; }
        public int Green { get; set; }
        public List<HomeImageDescriptionSettingsArea> Childs { get; set; }
    }

    public class HomeImageDescription
    {
        public int globalMargin { get; set; }
        public List<HomeImageDescriptionArea> childs { get; set; }
    }

    public class HomeImageDescriptionArea
    {
        public byte UID { get; set; }
        public string image { get; set; }
        public int x { get; set; }
        public int y { get; set; }
        public int width { get; set; }
        public int height { get; set; }
        public List<HomeImageDescriptionArea> childs { get; set; }
    }
}
