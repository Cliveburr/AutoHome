using AH.Protocol.Library.Value;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Entities.State
{
    public class LedRibbonRgbState
    {
        public bool IsStandard { get; set; }
        public string StandardId { get; set; }
        public RgbLightValue Value { get; set; }
    }
}