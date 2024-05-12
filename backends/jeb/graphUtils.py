import json
import struct
from java.io import BufferedOutputStream
from com.pnfsoftware.jeb.core.units.code.android import IDexUnit
from com.pnfsoftware.jeb.core.units.code.android.dex import (
    IDexMethod,
    IDexClass,
    IDexField,
)
from com.pnfsoftware.jeb.core.units.code.java import IJavaSourceUnit
from org.python.core.util import StringUtil
from org.eclipse.swt import SWT
from org.eclipse.swt.layout import GridLayout
from org.eclipse.swt.widgets import Display, Shell, ProgressBar
from java.lang import Runnable


def send_update(ctx, data):
    prj = ctx.getMainProject()
    dex = prj.findUnit(IDexUnit)
    for listener in dex.getListeners():
        if hasattr(listener, "IN_SCRIPT"):
            raw_data = StringUtil.toBytes(json.dumps(data))
            out = BufferedOutputStream(listener.sock.getOutputStream())
            out.write(struct.pack(">i", len(raw_data)))
            out.write(raw_data)
            out.flush()
            break
    else:
        print("Graffiti: Not connected (or multiple project/dex units)")


def get_current_method(ctx):
    view = ctx.getFocusedView()
    unit = view.getUnit()
    if isinstance(unit, IJavaSourceUnit) or isinstance(unit, IDexUnit):
        dexdec = unit.getDecompiler().getCodeUnit()
        f = ctx.getFocusedFragment()
        assert f, "Need a focused fragment"
        dex_addr = f.getActiveAddress()
        assert dex_addr, "Need to have dex address"
        method = dexdec.getMethod(dex_addr)
        return method

    return None


def get_current_field(ctx):
    view = ctx.getFocusedView()
    unit = view.getUnit()
    if isinstance(unit, IJavaSourceUnit) or isinstance(unit, IDexUnit):
        dexdec = unit.getDecompiler().getCodeUnit()
        f = ctx.getFocusedFragment()
        assert f, "Need a focused fragment"
        dex_addr = f.getActiveAddress()
        assert dex_addr, "Need to have dex address"
        field = dexdec.getField(dex_addr)
        return field

    return None


def get_current_class(ctx):
    view = ctx.getFocusedView()
    unit = view.getUnit()
    if isinstance(unit, IJavaSourceUnit) or isinstance(unit, IDexUnit):
        dexdec = unit.getDecompiler().getCodeUnit()
        f = ctx.getFocusedFragment()
        assert f, "Need a focused fragment"
        dex_addr = f.getActiveAddress()
        assert dex_addr, "Need to have dex address"
        cls = dexdec.getClass(dex_addr)
        return cls

    return None


def get_current_address(ctx):
    view = ctx.getFocusedView()
    unit = view.getUnit()
    if isinstance(unit, IJavaSourceUnit) or isinstance(unit, IDexUnit):
        dexdec = unit.getDecompiler().getCodeUnit()
        f = ctx.getFocusedFragment()
        assert f, "Need a focused fragment"
        dex_addr = f.getActiveAddress()
        assert dex_addr, "Need to have dex address"
        return dex_addr

    return None


def rchop(s, sub):
    return s[: -len(sub)] if s.endswith(sub) else s


def create_rename(target):
    if isinstance(target, IDexMethod):
        return {
            "type": "updateNodes",
            "selection": [
                [["address", target.getSignature(False)]],
                [["methodAddress", target.getSignature(False)]],
            ],
            "update": {"method": target.getName(True) or target.getName(False)},
            "version": 2,
        }
    elif isinstance(target, IDexClass):
        return {
            "type": "updateNodes",
            "selection": [["classAddress", target.getSignature(False)]],
            "update": {"class": target.getName(True) or target.getName(False)},
        }
    elif isinstance(target, IDexField):
        return {
            "type": "updateNodes",
            "selection": [["address", target.getSignature(False)]],
            "update": {"field": target.getName(True) or target.getName(False)},
        }
    return None


def get_dex_unit_sig(unit):
    result = bytearray([0] * 20)
    for f in unit.dexFiles:
        sig = f.exepctedSignature
        for j in range(len(sig)):
            result[j] ^= sig[j]
    return result


class ProgressBarWindow:
    def __init__(self, name):
        self.display = Display.getDefault()
        self.shell = Shell(self.display)
        self.shell.text = name

        layout = GridLayout()
        layout.marginWidth = 100
        layout.marginHeight = 10
        self.shell.setLayout(layout)

        self.progress_bar = ProgressBar(self.shell, SWT.HORIZONTAL)

        self.shell.pack()

    def update_progress(self, value):
        class SelectionRunnable(Runnable):
            def run(x):
                self.progress_bar.setSelection(value)

        class CloseRunnable(Runnable):
            def run(x):
                self.shell.close()

        if value >= 100:
            self.display.syncExec(CloseRunnable())
        else:
            self.display.syncExec(SelectionRunnable())

    def show(self):
        class OpenRunnable(Runnable):
            def run(x):
                self.shell.open()

        self.display.syncExec(OpenRunnable())
