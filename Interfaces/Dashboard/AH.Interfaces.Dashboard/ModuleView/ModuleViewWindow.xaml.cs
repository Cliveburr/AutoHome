using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;

namespace AH.Interfaces.Dashboard.ModuleView
{
    public partial class ModuleViewWindow : Window
    {
        //private ModuleViewConnector _connector;

        public ModuleViewWindow()
        {
            InitializeComponent();

           // _connector = connector;


            SetFrames();
        }

        private void SetFrames()
        {
            //frAutoHome.Navigate(new AutoHome.AutoHomePage(_connector));
            //frFota.Navigate(new Fota.FotaPage(_connector));
            //frTempHumiSensor.Navigate(new TempHumiSensor.TempHumiSensorPage(_connector));
        }

        private void Window_Closed(object sender, EventArgs e)
        {

        }
    }
}