﻿using AH.Protocol.Lan;
using AH.Protocol.Library;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    public class Program
    {
        public static AhProtocol AutoHome { get; set; }
        public static LanProtocol Lan { get; set; }

        public static void Main(string[] args)
        {
            Console.WriteLine("Starting AH.Module.Simulation...");

            Lan = new LanProtocol(15556, 15555);
            AutoHome = new AhProtocol(2, Lan);
            AutoHome.Receiver += AutoHome_Receiver;

            ConsoleKey key;
            do
            {
                key = Console.ReadKey().Key;
                switch (key)
                {
                    case ConsoleKey.A:
                        {
                            var msg0 = new LanMessage(1, IPAddress.Broadcast, LanMessageType.Nop, new byte[0]);
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
    }

    public class Sender
    {
        public async void Send()
        {
            var client = new UdpClient();
            var ip = new IPEndPoint(IPAddress.Broadcast, 16000);
            byte[] bytes = Encoding.ASCII.GetBytes("Foo 2");
            await client.SendAsync(bytes, bytes.Length, ip);
        }
    }
}
