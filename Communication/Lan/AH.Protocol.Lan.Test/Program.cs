using AH.Protocol.Lan;
using AH.Protocol.Library;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.IO;
using AH.Protocol.Library.Module.LedRibbonRGB;

namespace AH.Protocol.WLan.Tests
{
    public delegate void StageAction(StageContext context);

    public class StageContext
    {
        public StageAction Current;
        public bool IsHeader;
        public bool Finish;
        public IList<ConsoleKeyInfo> Keys;
    }

    public class Program
    {
        public static IConfigurationRoot Configuration { get; set; }
        public static AhProtocol AutoHome { get; set; }
        public static LanProtocol Lan { get; set; }

        public static void Main(string[] args)
        {
            Configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("config.json")
                .Build();

            Console.WriteLine("Program AH.Protocol.Lan.Test...");
            Console.WriteLine();

            var uid = ushort.Parse(Configuration["UID"]);
            var sendPort = int.Parse(Configuration["SendPort"]);
            var receivePort = int.Parse(Configuration["ReceivePort"]);

            Console.WriteLine("UID: " + Configuration["UID"]);
            Console.WriteLine("SendPort: " + Configuration["SendPort"]);
            Console.WriteLine("ReceivePort: " + Configuration["ReceivePort"]);

            Lan = new LanProtocol(receivePort, sendPort);
            AutoHome = new AhProtocol(uid, Lan);
            AutoHome.Receiver += AutoHome_Receiver;

            Console.WriteLine("Protocol open");
            Console.WriteLine();

            var context = new StageContext
            {
                Current = StageInitial,
                IsHeader = true,
                Finish = false,
                Keys = new List<ConsoleKeyInfo>()
            };

            while (!context.Finish)
            {
                context.Current(context);

                if (context.IsHeader)
                {
                    context.Keys.Clear();
                }
                else
                {
                    context.Keys.Add(Console.ReadKey(false));
                }
            };
        }

        private static void AutoHome_Receiver(MessageBase message)
        {
            Console.WriteLine("Message income:");
            Console.WriteLine(message.ToString());

            var lanMsg = message as LanMessage;
            switch (lanMsg.Type)
            {
                case LanMessageType.InfoResponse:
                    {
                        var info = InfoMessage.Parse(lanMsg.MessageBody);
                        Console.WriteLine(info.ToString());
                        break;
                    }
            }
        }

        private static void StageInitial(StageContext context)
        {
            if (context.IsHeader)
            {
                Console.WriteLine("Choose the task you wish to run:");
                Console.WriteLine("1 - Broadcast InfoRequest");
                Console.WriteLine("2 - Request LedRibbonRGB state");
                Console.WriteLine("3 - Change LedRibbonRGB state");
                context.IsHeader = false;
            }
            else
            {
                if (context.Keys.Any())
                {
                    switch (context.Keys.Last().Key)
                    {
                        case ConsoleKey.D1:
                            {
                                Console.WriteLine("Sending Broadcast InfoRequest...");
                                var msg0 = new LanMessage(0, IPAddress.Broadcast, LanMessageType.InfoRequest, new byte[] { });
                                AutoHome.Send(msg0);
                                context.Keys.Clear();
                                break;
                            }
                        case ConsoleKey.D2:
                            {
                                Console.WriteLine("Requesting LedRibbonRGB state...");
                                var moduleMsg = LedribbonRGBMessage.CreateRequestState();
                                var msg0 = new LanMessage(0, IPAddress.Broadcast, LanMessageType.ModuleMessage, moduleMsg.GetBytes());
                                AutoHome.Send(msg0);
                                context.Keys.Clear();
                                break;
                            }
                        case ConsoleKey.D3:
                            {
                                Console.WriteLine("Change the LedRibbonRGB state...");
                                var rnd = new Random(DateTime.Now.Millisecond);
                                var moduleMsg = LedribbonRGBMessage.CreateChangeState(new LedribbonRGBState
                                {
                                    Red = (byte)rnd.Next(0, 255),
                                    Green = (byte)rnd.Next(0, 255),
                                    Blue = (byte)rnd.Next(0, 255)
                                });
                                var msg0 = new LanMessage(0, IPAddress.Broadcast, LanMessageType.ModuleMessage, moduleMsg.GetBytes());
                                AutoHome.Send(msg0);
                                context.Keys.Clear();
                                break;
                            }
                        case ConsoleKey.Escape:
                            context.Finish = true;
                            break;
                        default:
                            Console.WriteLine("Invalid!");
                            break;
                    }
                }
            }
        }
    }
}