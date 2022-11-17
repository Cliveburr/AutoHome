﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Interfaces.Dashboard.Main.HomeProject
{
    public class HomeImageDescription
    {
        public int GlobalMargin { get; set; }
        public List<HomeImageDescriptionArea> Areas { get; set; }
    }

    public class HomeImageDescriptionArea
    {
        public byte? UID { get; set; }
        public string Name { get; set; }
        public string Image { get; set; }
        public int Red { get; set; }
        public int Blue { get; set; }
        public int Green { get; set; }
        public int PointX { get; set; }
        public int PointY { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
    }
}
