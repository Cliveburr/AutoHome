using AH.Control.Api.Entities;
using AH.Protocol.Library.Value;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Control.Api.Models.Standard
{
    public class EditorViewModel
    {
        public string StandardId { get; set; }
        public string Name { get; set; }
        public StandardType Type { get; set; }
        public RgbLightValue RgbLightValue { get; set; }
    }
}
