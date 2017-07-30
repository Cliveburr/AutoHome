using AH.Module.Controller.Protocol;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace AH.Module.Controller
{
    public static class Program
    {
        public static Application App { get; private set; }
        public static MainWindow MainWindow { get; private set; }
        public static AutoHome AutoHome { get; set; }

        [STAThread]
        public static void Main()
        {
            MainWindow = new MainWindow();
            MainWindow.Show();

            App = new Application();
            App.ShutdownMode = ShutdownMode.OnExplicitShutdown;
            App.Run();
        }

        public static void Close()
        {
            AutoHome?.Dispose();
            App.Shutdown();
        }
    }
}