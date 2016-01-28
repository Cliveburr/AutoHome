using System;
using System.Threading.Tasks;
using System.Windows.Forms;

public class UsbMonitor : NativeWindow, IDisposable
{
    private const uint ARRIVAL = 0x8000;
    private const uint REMOVE = 0x8004;
    private readonly Guid _guidUSBDeviceInterface = new Guid("A5DCBF10-6530-11D2-901F-00C04FB951ED");
    private IntPtr _notificationHandle;

    public delegate void UsbChangeEventHandler();
    public UsbChangeEventHandler UsbChangeEventArrival;
    public UsbChangeEventHandler UsbChangeEventRemoved;

    public UsbMonitor()
    {
        CreateHandle(new CreateParams
        {
            ClassName = null,
            Parent = IntPtr.Zero
        });

        RegisterNotification();
    }

    private void RegisterNotification()
    {
        _notificationHandle = NativeNET.User32.Notification.DeviceNotification.Register(Handle,
            _guidUSBDeviceInterface,
            NativeNET.User32.Notification.RegisterDeviceNotificationFlags.DEVICE_NOTIFY_WINDOW_HANDLE);
    }

    public void Dispose()
    {
        NativeNET.User32.Notification.DeviceNotification.Unregister(_notificationHandle);
    }

    protected override void WndProc(ref Message m)
    {
        base.WndProc(ref m);
        if (m.Msg == NativeNET.Windows.Messages.WM_DEVICECHANGE)
        {
            switch ((uint)m.WParam)
            {
                case REMOVE:
                    Task.Run(() =>
                    {
                        if (UsbChangeEventRemoved != null)
                            UsbChangeEventRemoved();
                    });
                    break;
                case ARRIVAL:
                    Task.Run(() =>
                    {
                        if (UsbChangeEventArrival != null)
                            UsbChangeEventArrival();
                    });
                    break;
            }
        }
    }
}