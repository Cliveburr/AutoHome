using AH.Interfaces.Dashboard.ModuleView.CellingFan;
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

namespace AH.Interfaces.Dashboard.Main
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();

            App.Instance.SelectedChanged += Instance_SelectedChanged;
        }

        private void Instance_SelectedChanged()
        {
            if (frHome.CanGoBack)
            {
                frHome.GoBack();
            }

            switch (App.Instance.Selected.ModuleType)
            {
                case Protocol.Library.ModuleType.CellingFan:
                    frHome.Navigate(new CellingFanPage());
                    break;
            }
        }
    }
}
