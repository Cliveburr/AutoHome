using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace AH.Protocol.Library
{
    public class AHProtocol : IAHProtocol
    {
        public int TimeOut { get; set; }
        public MessageArriveDelegate MessageArrive { get; set; }

        private ushort _UID;
        private byte _messageID;
        private IList<MessageStack> _messageStack;
        private IList<MessageStack> _messageWaiting;
        private IPhysicalProtocolCouple _physicalCouple;
        private bool _senderStackQueue;

        private class MessageStack
        {
            public MessagePackage Package;
            public MessageArriveDelegate Callback;
            public Timer TimeoutTimer;
        }

        public AHProtocol(ushort UID, int timeOut, MessageArriveDelegate messageArrive, IPhysicalProtocolCouple physicalCouple)
        {
            _UID = UID;
            TimeOut = timeOut;
            MessageArrive = messageArrive;
            _messageID = 0;
            _messageStack = new List<MessageStack>();
            _messageWaiting = new List<MessageStack>();
            _physicalCouple = physicalCouple;
            _physicalCouple.Receiver += Receiver;
        }

        public ushort UID
        {
            get
            {
                return _UID;
            }
        }

        public void Send(ushort receiverUID, byte[] messageBody, MessageArriveDelegate callBack = null)
        {
            var messsageID = _messageID++;

            var configuration = MessageConfigurationEnum.None;
            if (callBack != null)
                configuration |= MessageConfigurationEnum.NeedConfirmation;

            var package = new MessagePackage(_UID, receiverUID, messsageID, configuration, messageBody);

            var messageStack = new MessageStack
            {
                Package = package,
                Callback = callBack
            };

            var time = new Timer(WaitingTimeoutCallback, messageStack, TimeOut, Timeout.Infinite);
            messageStack.TimeoutTimer = time;

            lock (_messageStack)
            {
                _messageStack.Add(messageStack);
            }

            CheckSenderStack();
        }

        private object _checkSenderStackLock = new object();

        private void CheckSenderStack()
        {
            lock (_checkSenderStackLock)
            {
                if (_senderStackQueue)
                    return;

                if (_messageStack.Any())
                {
                    _senderStackQueue = true;
                    Task.Run(() => RunSenderStack());
                }
            }
        }

        private void WaitingTimeoutCallback(object state)
        {
            var message = (MessageStack)state;

            message.TimeoutTimer?.Dispose();
            message.Callback?.Invoke(MessageArriveCode.Timeout, message.Package);

            CheckSenderStack();
        }

        private void RunSenderStack()
        {
            System.Diagnostics.Debug.WriteLine("RunSenderStack in");
            MessageStack message;
            lock (_messageStack)
            {
                lock (_messageWaiting)
                {
                    message = _messageStack
                        .Where(s =>
                        {
                            if ((s.Package.Configuration & MessageConfigurationEnum.IsConfirmation) != 0)
                                return true;

                            var has = _messageWaiting
                                .Where(mw => mw.Package.ReceiverUID == s.Package.ReceiverUID)
                                .FirstOrDefault();
                            return has == null;
                        })
                        .FirstOrDefault();
                }

                if (message == null)
                    return;

                _messageStack.Remove(message);
            }

            _physicalCouple.Send(message.Package);

            if (message.Callback != null)
            {
                lock (_messageWaiting)
                {
                    _messageWaiting.Add(message);
                }
            }

            lock (_checkSenderStackLock)
            {
                _senderStackQueue = false;
            }
            CheckSenderStack();
            System.Diagnostics.Debug.WriteLine("RunSenderStack out");
        }

        private void Receiver(MessagePackage package)
        {
            if (package.ReceiverUID != _UID)
                return;

            if ((package.Configuration & MessageConfigurationEnum.NeedConfirmation) != 0)
            {
                var packageConfirmation = new MessagePackage(_UID, package.SenderUID, package.MessageID, MessageConfigurationEnum.IsConfirmation, new byte[0]);

                var messageStack = new MessageStack
                {
                    Package = packageConfirmation
                };

                lock (_messageStack)
                {
                    _messageStack.Add(messageStack);
                }
            }

            if ((package.Configuration & MessageConfigurationEnum.IsConfirmation) != 0)
            {
                MessageStack message;
                lock (_messageWaiting)
                {
                    message = _messageWaiting
                        .Where(s => s.Package.ReceiverUID == package.SenderUID && s.Package.MessageID == package.MessageID)
                        .FirstOrDefault();

                    if (message != null)
                        _messageWaiting.Remove(message);
                }

                if (message == null)
                {
                    Task.Run(() => MessageArrive(MessageArriveCode.ConfirmationWithoutWaiting, package));
                }
                else
                {
                    message.TimeoutTimer?.Dispose();
                    message.Callback?.Invoke(MessageArriveCode.Ok, message.Package);
                }
            }
            else
            {
                Task.Run(() => MessageArrive(MessageArriveCode.Ok, package));
            }

            CheckSenderStack();
        }
    }
}