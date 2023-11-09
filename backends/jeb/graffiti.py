#?description=Enable graffiti support in project

import sys
import traceback
import json
from com.pnfsoftware.jeb.client.api import IScript
from com.pnfsoftware.jeb.core import RuntimeProjectUtil
from com.pnfsoftware.jeb.core.units.code.android.dex import IDexMethod, IDexClass, IDexField

from java.io import DataInputStream
from com.pnfsoftware.jeb.core.units.code.java import IJavaSourceUnit
from java.lang import Runnable, Thread
from java.net import Socket
from org.eclipse.swt.widgets import Display
from com.pnfsoftware.jeb.core.units import UnitChangeEventData
from com.pnfsoftware.jeb.core.units.code.android import IDexUnit
from com.pnfsoftware.jeb.util.events import IEventListener
from com.pnfsoftware.jeb.core.events import JebEvent, J
from org.python.core.util import StringUtil
import jarray

from graphUtils import send_update


class graffiti(IScript):
    def run(self, ctx):
        addr_and_port = ctx.displayQuestionBox('Input', 'Enter address and port for connection', 'localhost:8501')
        if not addr_and_port or not addr_and_port.strip():
            print("Aborting")
            return
        if addr_and_port.count(':') != 1:
            print("Not a valid address, aborting")
            return

        addr, port = addr_and_port.split(":")

        try:
            prj = ctx.getMainProject()
            dex = prj.findUnit(IDexUnit)
            for listener in dex.getListeners():
                if hasattr(listener, 'IN_SCRIPT'):
                    print('Closing old socket')
                    listener.close()
                    dex.removeListener(listener)

            dex.addListener(GraffitiListener(ctx, addr, int(port)))
            print('Listening to UnitChange events on: %s' % dex)
        except:
            traceback.print_exc(file=sys.stdout)


class GraffitiListener(IEventListener):
    def __init__(self, ctx, addr, port):
        self.ctx = ctx
        self.IN_SCRIPT = 1
        self.sock = Socket(addr, port)
        self.thread = Thread(GraffitiReadOnBackgroundRunnable(ctx, self.sock))

        self.thread.start()

    def close(self):
        self.sock.close()
        self.thread.interrupt()

    def onEvent(self, e):
        if isinstance(e, JebEvent) and e.type == J.UnitChange and e.data is not None:
            if e.data.type == UnitChangeEventData.NameUpdate:
                target = e.data.target
                res = None
                if isinstance(target, IDexMethod):
                    res = {
                        "type": "updateNodes",
                        "selection": [[["address", target.getSignature(False)]], [["methodAddress", target.getSignature(False)]]],
                        "update": {
                            "method": target.getName(True) or target.getName(False)
                        },
                        "version": 2
                    }
                elif isinstance(target, IDexClass):
                    res = {
                        "type": "updateNodes",
                        "selection": [["classAddress", target.getSignature(False)]],
                        "update": {
                            "class": target.getName(True) or target.getName(False)
                        }
                    }
                elif isinstance(target, IDexField):
                    res = {
                        "type": "updateNodes",
                        "selection": [["address", target.getSignature(False)]],
                        "update": {
                            "field": target.getName(True) or target.getName(False)
                        }
                    }

                if res:
                    send_update(self.ctx, res)


class GraffitiReadOnBackgroundRunnable(Runnable):
    def __init__(self, ctx, sock):
        self.ctx = ctx
        self.sock = sock

    def run(self):
        try:
            print("Connected to server")
            in_stream = DataInputStream(self.sock.getInputStream())
            while True:
                length = in_stream.readInt()
                bytes = jarray.zeros(length, "b")
                in_stream.readFully(bytes)
                line = StringUtil.fromBytes(bytes)

                if not line:
                    break
                data = json.loads(line)
                if 'project' in data:
                    # Support every JEB project for now, as I don't want complains from people who renamed the file
                    if not data['project'].startswith('Jeb:'):
                        continue

                # Also Support old files without project
                Display.getDefault().asyncExec(GraffitiHandlePullOnUI(self.ctx, data['address']))
            self.sock.close()
        except:
            traceback.print_exc(file=sys.stdout)


class GraffitiHandlePullOnUI(Runnable):
    def __init__(self, ctx, address):
        self.ctx = ctx
        self.address = address

    def run(self):
        try:
            prj = self.ctx.getMainProject()
            unit = RuntimeProjectUtil.findUnitsByType(prj, IJavaSourceUnit, False).get(0)
            if not unit:
                print('The DEX unit was not found')
                return

            if hasattr(self.ctx, 'navigate'):
                self.ctx.navigate(unit, self.address)
            else:
                # this code assumes that the active fragment is the disassembly (it may not be; strong script should focus the assembly fragment)
                self.ctx.openView(unit)
                self.ctx.getFocusedView().getActiveFragment().setActiveAddress(self.address)
        except:
            traceback.print_exc(file=sys.stdout)
