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
using AH.Module.Simulation.Mode;

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
                Console.WriteLine("SendPort: " + Configuration["SendPort"]);
                Console.WriteLine("ReceivePort: " + Configuration["ReceivePort"]);

                context.Mode = new LedRibbonRGBMode();
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
                        default:
                            Console.WriteLine("Invalid!");
                            break;
                    }
                }
            }
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
