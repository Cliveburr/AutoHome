using AH.Protocol.Library.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Messages.TempHumiSensor.BitMappers
{
    public class switchs_state_t
    {
        public byte Value;

        private int _tempSwtichState_pos = 0;
        public int _humiSwtichState_pos = 1;

        public bool tempSwtichState
        {
            get { return BitFields.ReadBool(Value, _tempSwtichState_pos); }
            set { BitFields.SetBool(ref Value, _tempSwtichState_pos, value); }
        }

        public bool humiSwtichState
        {
            get { return BitFields.ReadBool(Value, _humiSwtichState_pos); }
            set { BitFields.SetBool(ref Value, _humiSwtichState_pos, value); }
        }
    }
}