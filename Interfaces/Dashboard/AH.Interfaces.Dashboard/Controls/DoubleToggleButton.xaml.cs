using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Runtime.Remoting.Contexts;
using System.Security.RightsManagement;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Media.Media3D;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace AH.Interfaces.Dashboard.Controls
{
    public partial class DoubleToggleButton : UserControl
    {
        public static readonly DependencyProperty leftButtonProperty = DependencyProperty.Register(nameof(LeftButton), typeof(string), typeof(DoubleToggleButton), new PropertyMetadata("On"));

        public string LeftButton
        {
            get { return (string)GetValue(leftButtonProperty); }
            set
            {
                SetValue(leftButtonProperty, value);
                leftButton.Content = LeftButton;
            }
        }

        public static readonly DependencyProperty rightButtonProperty = DependencyProperty.Register(nameof(RightButton), typeof(string), typeof(DoubleToggleButton), new PropertyMetadata("Off"));

        public string RightButton
        {
            get { return (string)GetValue(rightButtonProperty); }
            set
            {
                SetValue(rightButtonProperty, value);
                rightButton.Content = RightButton;
            }
        }

        public static readonly DependencyProperty valueProperty = DependencyProperty.RegisterAttached(nameof(ValueToggle), typeof(bool), typeof(DoubleToggleButton), new FrameworkPropertyMetadata(false, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, ValueToggleChangedCallback, null, false, UpdateSourceTrigger.PropertyChanged));

        public bool ValueToggle
        {
            get { return (bool)GetValue(valueProperty); }
            set
            {
                SetValue(valueProperty, value);
                leftButton.IsChecked = value;
                rightButton.IsChecked = !value;
                ValueChanged?.Invoke(this, EventArgs.Empty);
            }
        }

        public static void ValueToggleChangedCallback(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            var control = (DoubleToggleButton)d;
            control.ValueToggle = (bool)e.NewValue;
        }

        public event EventHandler ValueChanged;

        private bool _disableEvents;

        public DoubleToggleButton()
        {
            InitializeComponent();
        }

        private void Left_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            _disableEvents = true;
            ValueToggle = true;
            _disableEvents = false;
        }

        private void Right_Checked(object sender, RoutedEventArgs e)
        {
            if (_disableEvents)
            {
                return;
            }
            _disableEvents = true;
            ValueToggle = false;
            _disableEvents = false;
        }

        private void UserControl_Loaded(object sender, RoutedEventArgs e)
        {
            _disableEvents = true;
            leftButton.Content = LeftButton;
            leftButton.IsChecked = ValueToggle;
            rightButton.Content = RightButton;
            rightButton.IsChecked = !ValueToggle;
            _disableEvents = false;
        }
    }
}
