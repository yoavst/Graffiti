#?description=Add node to graph with label
#?shortcut=Mod1+Mod2+X

from graphMe import graphMe


class graphMeWithEdgeInfo(graphMe):
    def create_method_update(self, ctx, method):
        obj = graphMe.create_method_update(self, ctx, method)
        edge_text = ctx.displayQuestionBox("Input", "Enter label for edge", "")
        if edge_text and edge_text.strip():
            obj["edge"] = {"label": edge_text}
        return obj

    def create_field_update(self, ctx, method):
        obj = graphMe.create_field_update(self, ctx, method)
        edge_text = ctx.displayQuestionBox("Input", "Enter label for edge", "")
        if edge_text and edge_text.strip():
            obj["edge"] = {"label": edge_text}
        return obj
