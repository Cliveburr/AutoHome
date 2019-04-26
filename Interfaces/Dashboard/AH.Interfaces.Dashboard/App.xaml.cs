using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;

namespace AH.Interfaces.Dashboard
{
    public partial class App : Application
    {
        public static App Instance { get; private set; }

        public App()
        {
            Instance = this;
        }

        public void ErrorHandler(Exception err)
        {
            if (err is AggregateException)
            {
                err = ((AggregateException)err).InnerExceptions.First();
            }

            Dispatcher.Invoke(() =>
            {
                MessageBox.Show(err.ToString());
            });
        }
    }
}
