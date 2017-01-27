using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Module.LedRibbonRGB
{
    public class LedRibbonRGBState
    {
        public byte Red { get; set; }
        public byte Green { get; set; }
        public byte Blue { get; set; }

        public override string ToString()
        {
            return $@"LedribbonRGBState
{{
    Red = {Red}
    Green = {Green}
    Blue = {Blue}
}}";
        }
    }
}