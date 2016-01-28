using System.Windows;

namespace AH.USB.Library.Test
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private Device _device;

        public MainWindow()
        {
            InitializeComponent();

            _device = new Device();
        }

        private void btSend_Click(object sender, RoutedEventArgs e)
        {
            _device.SendMessage(ushort.Parse(txIP.Text), byte.Parse(txCode.Text), txBody.Text);
        }
    }
}