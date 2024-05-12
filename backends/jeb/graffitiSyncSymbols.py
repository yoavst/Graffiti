#?description=Send all renamed symbols to the connected graffiti

import sys
import traceback
from graphUtils import *
from com.pnfsoftware.jeb.client.api import IScript
from com.pnfsoftware.jeb.core import RuntimeProjectUtil
from com.pnfsoftware.jeb.core.units.code import ICodeUnit
from java.lang import Runnable, Thread


class graffitiSyncSymbols(IScript):
    def run(self, ctx):
        try:
            prj = ctx.getMainProject()
            assert prj, "Need a project"

            units = RuntimeProjectUtil.findUnitsByType(prj, ICodeUnit, False)
            if not units:
                print("No code unit available")
                return

            progress_window = ProgressBarWindow("Sync symbols")
            progress_window.show()

            class UpdateRunnable(Runnable):
                def __init__(self):
                    self.i = 0
                    self.total_symbols = 0

                    for unit in units:
                        self.total_symbols += (
                            len(unit.classes) + len(unit.fields) + len(unit.methods)
                        )

                def update_progress(self):
                    self.i += 1
                    if self.i % 1000 == 0:
                        progress_window.update_progress(
                            int(100 * self.i / self.total_symbols)
                        )

                def complete_progress(self):
                    progress_window.update_progress(100)

                def run(self):
                    for unit in units:
                        for c in unit.classes:
                            self.update_progress()
                            name0 = c.getName(False)
                            name1 = c.getName(True)
                            if name0 != name1:
                                send_update(ctx, create_rename(c))

                        for f in unit.fields:
                            self.update_progress()
                            name0 = f.getName(False)
                            name1 = f.getName(True)
                            if name0 != name1:
                                send_update(ctx, create_rename(f))

                        for m in unit.methods:
                            self.update_progress()
                            name0 = m.getName(False)
                            name1 = m.getName(True)
                            if name0 != name1:
                                send_update(ctx, create_rename(m))

                    self.complete_progress()

            Thread(UpdateRunnable()).start()

        except:
            traceback.print_exc(file=sys.stdout)
