using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AH.Protocol.Library.Test
{
    public class PassingThroughCouple : IPhysicalProtocolCouple
    {
        public event ReceiverDelegate Receiver;
        public PassingThroughCouple Passing { get; set; }

        public void Send(MessagePackage package)
        {
            if (package.MessageBody.Length > 0)
            {
                if (package.MessageBody[0] > 0)
                    new Timer((object state) =>
                    {
                        Passing.Receiver(package);
                    }, null, package.MessageBody[0] * 100, Timeout.Infinite);
                else
                    Passing.Receiver(package);
            }
            else
                Passing.Receiver(package);
        }
    }
}