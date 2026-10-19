(function(global){
  const modules = new Map();
  function normalizeMetadata(metadata){
    const source=metadata&&typeof metadata==='object'&&!Array.isArray(metadata)?metadata:{};
    const tags=Array.isArray(source.tags)?source.tags.filter(tag=>typeof tag==='string').map(tag=>tag.trim()).filter(Boolean):[];
    return Object.freeze({
      apiVersion:Number.isInteger(source.apiVersion)&&source.apiVersion>0?source.apiVersion:1,
      version:typeof source.version==='string'&&source.version.trim()?source.version.trim():'1.0.0',
      difficulty:typeof source.difficulty==='string'&&source.difficulty.trim()?source.difficulty.trim():null,
      tags:Object.freeze(tags)
    });
  }
  const registry = {
    register(module){
      if(!module || typeof module.id!=='string' || !module.id.trim()) throw new Error('Game module requires a stable id');
      if(!/^[a-z0-9][a-z0-9._-]*$/i.test(module.id)) throw new Error('Game module id contains unsupported characters: '+module.id);
      if(typeof module.name!=='string' || !module.name.trim()) throw new Error('Game module requires a name');
      if(typeof module.renderControls!=='function') throw new Error(module.id+': renderControls() is required');
      if(module.resolveRound!==undefined&&typeof module.resolveRound!=='function') throw new Error(module.id+': resolveRound must be a function when provided');
      if(modules.has(module.id)) throw new Error('Duplicate game module id: '+module.id);
      const normalized={...module,metadata:normalizeMetadata(module.metadata)};
      modules.set(module.id,Object.freeze(normalized));
    },
    get(id){return modules.get(id)||null;},
    list(){return [...modules.values()];}
  };
  global.ARQGameRegistry=registry;
})(window);
