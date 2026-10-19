# Remove pedaços soltos ("lixo" flutuando) de um GLB gerado pelo Tripo: toda
# parte da malha que não encosta no resto e tem menos que a fração mínima dos
# vértices (padrão 1%) é apagada. Depois, rodar a dieta (gltf-transform).
# Uso:
#   "C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" -b #     --python scripts/clean_loose.py -- in.glb out.glb [fração mínima]
# A cama (10) usou 0.05.
import sys, bpy, bmesh
argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]
min_frac = float(argv[2]) if len(argv) > 2 else 0.01
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for obj in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    bm = bmesh.new(); bm.from_mesh(obj.data)
    # O glTF duplica vértices nas costuras de UV; juntar antes de achar as ilhas
    # (o UV fica nos cantos das faces, então não se perde).
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.verts.ensure_lookup_table()
    for i, v in enumerate(bm.verts): v.index = i
    seen = set(); islands = []
    for v in bm.verts:
        if v.index in seen: continue
        stack = [v]; isl = []
        seen.add(v.index)
        while stack:
            cur = stack.pop(); isl.append(cur)
            for e in cur.link_edges:
                o = e.other_vert(cur)
                if o.index not in seen:
                    seen.add(o.index); stack.append(o)
        islands.append(isl)
    total = len(bm.verts)
    for isl in sorted(islands, key=len, reverse=True)[:6]:
        xs=[v.co.x for v in isl]; ys=[v.co.y for v in isl]; zs=[v.co.z for v in isl]
        print('  ilha', len(isl), 'x', round(min(xs),2), round(max(xs),2), 'y', round(min(ys),2), round(max(ys),2), 'z', round(min(zs),2), round(max(zs),2))
    islands.sort(key=len, reverse=True)
    kill = [v for isl in islands if len(isl) < total * min_frac for v in isl]
    print(f'{obj.name}: {len(islands)} ilhas, maiores {[len(i) for i in islands[:8]]}, removendo {len(kill)} vértices de {sum(1 for i in islands if len(i) < total*min_frac)} ilhas')
    bmesh.ops.delete(bm, geom=kill, context='VERTS')
    bm.to_mesh(obj.data); bm.free()
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB')
