using AH.Protocol.Library;
using System;
using System.Linq;
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

        public static void ErrorHandler(Exception err)
        {
            if (err is AggregateException)
            {
                err = ((AggregateException)err).InnerExceptions.First();
            }

            MainWindow.Dispatcher.Invoke(() =>
            {
                MessageBox.Show(err.ToString());
            });
        }
    }
}