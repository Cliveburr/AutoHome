using AH.Protocol.Library.Value;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Module.LedRibbonRGB
{
    public class LedribbonRGBMessage
    {
        public LedribbonRGBMessageType Type { get; private set; }
        public RgbLightValue State { get; private set; }

        private LedribbonRGBMessage()
        {
        }

        public static LedribbonRGBMessage CreateStateRequest()
        {
            return new LedribbonRGBMessage
            {
                Type = LedribbonRGBMessageType.StateRequest
            };
        }

        public static LedribbonRGBMessage CreateStateResponse(RgbLightValue state)
        {
            return new LedribbonRGBMessage
            {
                Type = LedribbonRGBMessageType.StateResponse,
                State = state
            };
        }

        public static LedribbonRGBMessage CreateStateChange(RgbLightValue state)
        {
            return new LedribbonRGBMessage
            {
                Type = LedribbonRGBMessageType.StateChange,
                State = state
            };
        }

        public byte[] GetBytes()
        {
            using (var mem = new MemoryStream())
            {
                mem.WriteByte((byte)Type);

                var hasState = Type == LedribbonRGBMessageType.StateChange || Type == LedribbonRGBMessageType.StateResponse;

                if (hasState)
                {
                    var state = State == null ?
                        new byte[] { 0, 0, 0 } :
                        new byte[] { State.Red, State.Green, State.Blue };
                    mem.Write(state, 0, state.Length);
                }

                return mem.ToArray();
            }
        }

        public static LedribbonRGBMessage Parse(byte[] bytes)
        {
            using (var mem = new MemoryStream(bytes))
            {
                var typeBytes = new byte[1];
                mem.Read(typeBytes, 0, 1);
                var type = (LedribbonRGBMessageType)typeBytes[0];

                var hasState = type == LedribbonRGBMessageType.StateChange || type == LedribbonRGBMessageType.StateResponse;

                if (hasState)
                {
                    var stateBytes = new byte[3];
                    mem.Read(stateBytes, 0, 3);

                    return new LedribbonRGBMessage
                    {
                        Type = type,
                        State = new RgbLightValue
                        {
                            Red = stateBytes[0],
                            Green = stateBytes[1],
                            Blue = stateBytes[2]
                        }
                    };
                }
                else
                {
                    return new LedribbonRGBMessage
                    {
                        Type = type,
                        State = null
                    };
                }
            }
        }
    }
}