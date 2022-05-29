#?description=Listen to onclick in graph

import sys
import traceback
from com.pnfsoftware.jeb.client.api import IScript
from com.pnfsoftware.jeb.core import RuntimeProjectUtil
from com.pnfsoftware.jeb.core.units.code.android import IDexUnit, IDexDecompilerUnit
from com.pnfsoftware.jeb.core.units.code.android.dex import IDexMethod, IDexClass

from java.io import InputStreamReader, BufferedReader
from com.pnfsoftware.jeb.core.units.code.java import IJavaSourceUnit
from java.lang import Runnable, Thread
from java.net import Socket
from org.eclipse.swt.widgets import Display
from com.pnfsoftware.jeb.core.units import UnitChangeEventData
from com.pnfsoftware.jeb.core.units.code.android import IDexUnit
from com.pnfsoftware.jeb.util.events import IEventListener
from com.pnfsoftware.jeb.core.events import JebEvent, J

from graphUtils import *


class graphPull(IScript):
    def run(self, ctx):
        try:
            Thread(RunOnBackground(ctx)).start()

            prj = ctx.getMainProject()
            dex = prj.findUnit(IDexUnit)
            for listener in dex.getListeners():
                if hasattr(listener, 'IN_SCRIPT'):
                    dex.removeListener(listener)

            dex.addListener(RenameListener(ctx))
            print('Listening to UnitChange events on: %s' % dex)
        except:
            traceback.print_exc(file=sys.stdout)

class RenameListener(IEventListener):
  def __init__(self, ctx):
    self.ctx = ctx
    self.IN_SCRIPT = 1

  def onEvent(self, e):
    if isinstance(e, JebEvent) and e.type == J.UnitChange and e.data != None:
        print('++++ %s' % e.data)
        if e.data.type == UnitChangeEventData.NameUpdate:
            target = e.data.target
            res = None
            if isinstance(target, IDexMethod):
                res = {
                    "type": "updateNodes", 
                    "selection": [["address", target.getSignature(False)]],
                    "update": {
                        "method": target.getName(True) or target.getName(False)
                    }
                }
            elif isinstance(target, IDexClass):
                res = {
                    "type": "updateNodes", 
                    "selection": [["classAddress", target.getSignature(False)]],
                    "update": {
                        "class": target.getName(True) or target.getName(False)
                    }
                }
            
            if res:
                send_update(res)

        


class RunOnBackground(Runnable):
    def __init__(self, ctx):
        self.ctx = ctx

    def run(self):
        try:
            s = Socket("localhost", 8763)
            print("Listening to pull events")
            in_stream = BufferedReader(InputStreamReader(s.getInputStream()))
            while True:
                line = in_stream.readLine()
                print(line)
                Display.getDefault().asyncExec(RunOnUI(self.ctx, line))
        except:
            traceback.print_exc(file=sys.stdout)


class RunOnUI(Runnable):
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

            # this code assumes that the active fragment is the disassembly (it may not be; strong script should focus the assembly fragment)
            self.ctx.openView(unit)
            self.ctx.getFocusedView().getActiveFragment().setActiveAddress(self.address)
        except:
            traceback.print_exc(file=sys.stdout)