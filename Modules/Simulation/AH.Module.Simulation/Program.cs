using AH.Protocol.Lan;
using AH.Protocol.Library;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using Microsoft.Extensions.Configuration;
using System.IO;
using AH.Module.Simulation.Mode;
using AH.Protocol.Library.Message;
using AH.Protocol.Lan.Message;

namespace AH.Module.Simulation
{
    public delegate void StageAction(StageContext context);

    public class StageContext
    {
        public StageAction Current;
        public bool IsHeader;
        public bool Finish;
        public IList<ConsoleKeyInfo> Keys;
        public ModeBase Mode;
    }

    public class Program
    {
        public static IConfigurationRoot Configuration { get; set; }

        private static LedRibbonRGBMode _ledRibbonRGBMode;

        public static void Main(string[] args)
        {
            Configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("config.json")
                .Build();

            Console.WriteLine("Program AH.Module.Simulation...");
            Console.WriteLine();

            var context = new StageContext
            {
                Current = ChooseSimulation,
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

            Console.WriteLine("Closing...");
        }

        private static void ChooseSimulation(StageContext context)
        {
            if (context.IsHeader)
            {
                Console.WriteLine("Choose the simulation you wish to run:");
                Console.WriteLine("1 - LedRibbonRGB");
                Console.WriteLine("2 - Custom");
                context.IsHeader = false;
            }
            else
            {
                if (context.Keys.Any())
                {
                    switch (context.Keys.Last().Key)
                    {
                        case ConsoleKey.D1:
                            context.Current = LedRibbonRGBSimulation;
                            context.IsHeader = true;
                            break;
                        case ConsoleKey.D2:
                            context.Current = CustomSimluation;
                            break;
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

        private static void LedRibbonRGBSimulation(StageContext context)
        {
            if (context.IsHeader)
            {
                Console.WriteLine();
                Console.WriteLine("Simulation an LedRibbonRGB module");
                Console.WriteLine("UID: " + Configuration["UID"]);
                Console.WriteLine("TCP_SendPort: " + Configuration["TCP_SendPort"]);
                Console.WriteLine("TCP_ReceivePort: " + Configuration["TCP_ReceivePort"]);
                Console.WriteLine("UDP_SendPort: " + Configuration["UDP_SendPort"]);
                Console.WriteLine("UDP_ReceivePort: " + Configuration["UDP_ReceivePort"]);

                _ledRibbonRGBMode = new LedRibbonRGBMode();
                context.Mode = _ledRibbonRGBMode;
                context.Mode.Context = context;

                Console.WriteLine("Simulation starting...");
                context.Mode.Start();

                context.IsHeader = false;
            }
            else
            {
                if (context.Keys.Any())
                {
                    switch (context.Keys.Last().Key)
                    {
                        case ConsoleKey.Escape:
                            context.Finish = true;
                            break;
                        case ConsoleKey.R:
                            _ledRibbonRGBMode.ModuleStart();
                            break;
                        default:
                            Console.WriteLine("Invalid!");
                            break;
                    }
                }
            }
        }

        private static void CustomSimluation(StageContext context)
        {
            var uid = ushort.Parse(Program.Configuration["UID"]);
            var sendPort = int.Parse(Program.Configuration["SendPort"]);
            var receivePort = int.Parse(Program.Configuration["ReceivePort"]);

            var lan = new LanProtocol(15555, 15555, 15555, 15555);
            var autoHome = new AhProtocol(0, lan);
            autoHome.Receiver += new ReceiverDelegate((MessageBase message) =>
            {
                var a = 1;
            });

            var address = IPAddress.Parse("");
            var msg = new LanMessage(uid, address, MessageType.InfoRequest);
            autoHome.Send(msg);
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
