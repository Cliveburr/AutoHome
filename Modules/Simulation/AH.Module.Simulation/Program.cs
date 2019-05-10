using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation
{
    class Program
    {
        public static AutoHomeSimulator Simulator { get; private set; }

        static void Main(string[] args)
        {
            Log("AutoHome Module Simulation");

            Simulator = new AutoHomeSimulator
            {
                SendPort = 15556,
                ReceivePort = 15555,
                UID = 6
            };

            Log($"UID: {Simulator.UID}");

            Simulator.Start();

            Console.ReadKey();
        }

        public static void Log(string msg)
        {
            Console.WriteLine(msg);
        }
    }
}