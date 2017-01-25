using AH.Protocol.Lan;
using AH.Protocol.Library;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Protocol.WLan.Tests
{
    public enum Stage
    {
        Initial = 0
    }

    public class Program
    {
        public static AhProtocol AutoHome { get; set; }
        public static LanProtocol Lan { get; set; }

        public static void Main(string[] args)
        {
            Console.WriteLine("Starting AH.Protocol.Lan.Test...");

            Lan = new LanProtocol(15555, 15556);
            AutoHome = new AhProtocol(1, Lan);
            AutoHome.Receiver += AutoHome_Receiver;

            ConsoleKey key;
            do
            {
                
                key = Console.ReadKey(true).Key;
                switch (key)
                {
                    case ConsoleKey.A:
                        {
                            var msg0 = new LanMessage(2, IPAddress.Broadcast, LanMessageType.Nop, new byte[] { 1, 3, 2 });
                            AutoHome.Send(msg0);
                            break;
                        }
                }

            } while (key != ConsoleKey.Escape);
        }

        private static void AutoHome_Receiver(MessageBase message)
        {
            Console.WriteLine("New message receiver...");
            Console.WriteLine(message.ToString());
        }

        private static string StageInitialHead()
        {
            yield return "";
        }
    }
}