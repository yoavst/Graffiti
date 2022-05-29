#?description=Listen to onclick in graph

import sys
import traceback
from com.pnfsoftware.jeb.client.api import IScript
from com.pnfsoftware.jeb.core import RuntimeProjectUtil
from com.pnfsoftware.jeb.core.units.code.android import IDexUnit, IDexDecompilerUnit
from java.io import InputStreamReader, BufferedReader
from com.pnfsoftware.jeb.core.units.code.java import IJavaSourceUnit
from java.lang import Runnable, Thread
from java.net import Socket
from org.eclipse.swt.widgets import Display

class graphPull(IScript):
    def run(self, ctx):
        try:
            Thread(RunOnBackground(ctx)).start()
        except:
            traceback.print_exc(file=sys.stdout)


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