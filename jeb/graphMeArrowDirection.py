#?description=Change direction to arrow for graph
#?shortcut=Mod1+Mod2+Z

import sys
import traceback
from graphUtils import *
from com.pnfsoftware.jeb.client.api import IScript


class graphMeArrowDirection(IScript):
    def run(self, ctx):
        try:
            direction = get_arrow_direction(ctx)
            set_arrow_direction(ctx, not direction)
            print "Changed direction for arrow, now:", self.direction_to_text(direction)
        except:
            traceback.print_exc(file=sys.stdout)

    def direction_to_text(self, direction):
        if direction:
            return "Selected in graph TO select in JEB"
        else:
            return "Selected in JEB TO select in graph"

