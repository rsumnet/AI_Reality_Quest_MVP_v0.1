(function(global){
  const modules = new Map();
  const registry = {
    register(module){
      if(!module || typeof module.id!=='string' || !module.id.trim()) throw new Error('Game module requires a stable id');
      if(typeof module.name!=='string' || !module.name.trim()) throw new Error('Game module requires a name');
      if(typeof module.renderControls!=='function') throw new Error(module.id+': renderControls() is required');
      if(modules.has(module.id)) throw new Error('Duplicate game module id: '+module.id);
      modules.set(module.id,Object.freeze({...module}));
    },
    get(id){return modules.get(id)||null;},
    list(){return [...modules.values()];}
  };
  global.ARQGameRegistry=registry;
})(window);
