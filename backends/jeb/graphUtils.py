import json
from java.io import PrintWriter
from com.pnfsoftware.jeb.core.units.code.android import IDexUnit
from com.pnfsoftware.jeb.core.units.code.java import IJavaSourceUnit



def send_update(ctx, data):
    prj = ctx.getMainProject()
    dex = prj.findUnit(IDexUnit)
    for listener in dex.getListeners():
        if hasattr(listener, 'IN_SCRIPT'):
            out = PrintWriter(listener.sock.getOutputStream(), True)
            out.print(json.dumps(data))
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
        assert f, 'Need a focused fragment'
        dex_addr = f.getActiveAddress()
        assert dex_addr, 'Need to have dex address'
        method = dexdec.getMethod(dex_addr)
        return method

    return None

def get_current_field(ctx):
    view = ctx.getFocusedView()
    unit = view.getUnit()
    if isinstance(unit, IJavaSourceUnit) or isinstance(unit, IDexUnit):
        dexdec = unit.getDecompiler().getCodeUnit()
        f = ctx.getFocusedFragment()
        assert f, 'Need a focused fragment'
        dex_addr = f.getActiveAddress()
        assert dex_addr, 'Need to have dex address'
        field = dexdec.getField(dex_addr)
        return field

    return None

def rchop(s, sub):
    return s[:-len(sub)] if s.endswith(sub) else s