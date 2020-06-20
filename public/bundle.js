
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Tailwindcss.svelte generated by Svelte v3.22.2 */

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tailwindcss> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tailwindcss", $$slots, []);
    	return [];
    }

    class Tailwindcss extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tailwindcss",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\Header\Nav.svelte generated by Svelte v3.22.2 */

    const file = "src\\Header\\Nav.svelte";

    function create_fragment$1(ctx) {
    	let nav;
    	let a0;
    	let img;
    	let img_src_value;
    	let t0;
    	let span;
    	let span_class_value;
    	let t1;
    	let div;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let a3;
    	let t7;
    	let a4;
    	let div_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			span = element("span");
    			t1 = space();
    			div = element("div");
    			a1 = element("a");
    			a1.textContent = "nosotros";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "productos";
    			t5 = space();
    			a3 = element("a");
    			a3.textContent = "clientes";
    			t7 = space();
    			a4 = element("a");
    			a4.textContent = "contacto";
    			if (img.src !== (img_src_value = "./src/img/assets/logo.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file, 21, 8, 384);
    			attr_dev(a0, "class", "\n        transform scale-150 md:transform scale-100 svelte-6al19x");
    			attr_dev(a0, "href", "#header");
    			add_location(a0, file, 18, 4, 288);
    			attr_dev(span, "class", span_class_value = "\n            fixed sm:hidden \n            flex flex-col justify-evenly items-center\n            w-12 h-12\n            top-0 right-0 \n            m-2 \n            cursor-pointer z-50 " + (/*toggle*/ ctx[0] ? "close" : "") + " svelte-6al19x");
    			add_location(span, file, 24, 4, 448);
    			attr_dev(a1, "href", "#nosotros");
    			attr_dev(a1, "class", "svelte-6al19x");
    			add_location(a1, file, 42, 8, 1063);
    			attr_dev(a2, "href", "#productos");
    			attr_dev(a2, "class", "svelte-6al19x");
    			add_location(a2, file, 43, 8, 1104);
    			attr_dev(a3, "href", "#clientes");
    			attr_dev(a3, "class", "svelte-6al19x");
    			add_location(a3, file, 44, 8, 1147);
    			attr_dev(a4, "href", "#contacto");
    			attr_dev(a4, "class", "svelte-6al19x");
    			add_location(a4, file, 45, 8, 1188);
    			attr_dev(div, "class", div_class_value = "\n            fixed sm:relative \n            flex flex-col sm:flex-row justify-around items-center\n            w-40 sm:h-auto sm:w-3/4\n            top-0 right-0\n            mt-20 mr-4 sm:m-0\n            overflow-hidden transition-all duration-300\n            bg-white rounded-md h-0 " + (/*toggle*/ ctx[0] ? "h-64" : "h-0"));
    			add_location(div, file, 34, 4, 733);
    			attr_dev(nav, "class", "\n        fixed\n        w-full h-16\n        z-40\n        flex justify-around items-center\n        bg-white\n        shadow-2xl\n\n        md:w-1/2 \n        md:h-12 \n        md:mt-4\n        \n        md:rounded-full\n        \n        lg:w-2/4 \n        xl:w-1/3");
    			add_location(nav, file, 1, 0, 9);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a0);
    			append_dev(a0, img);
    			append_dev(nav, t0);
    			append_dev(nav, span);
    			append_dev(nav, t1);
    			append_dev(nav, div);
    			append_dev(div, a1);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			append_dev(div, t5);
    			append_dev(div, a3);
    			append_dev(div, t7);
    			append_dev(div, a4);
    			if (remount) dispose();
    			dispose = listen_dev(span, "click", /*click_handler*/ ctx[1], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*toggle*/ 1 && span_class_value !== (span_class_value = "\n            fixed sm:hidden \n            flex flex-col justify-evenly items-center\n            w-12 h-12\n            top-0 right-0 \n            m-2 \n            cursor-pointer z-50 " + (/*toggle*/ ctx[0] ? "close" : "") + " svelte-6al19x")) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*toggle*/ 1 && div_class_value !== (div_class_value = "\n            fixed sm:relative \n            flex flex-col sm:flex-row justify-around items-center\n            w-40 sm:h-auto sm:w-3/4\n            top-0 right-0\n            mt-20 mr-4 sm:m-0\n            overflow-hidden transition-all duration-300\n            bg-white rounded-md h-0 " + (/*toggle*/ ctx[0] ? "h-64" : "h-0"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let toggle;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Nav", $$slots, []);
    	const click_handler = () => $$invalidate(0, toggle = !toggle);
    	$$self.$capture_state = () => ({ toggle });

    	$$self.$inject_state = $$props => {
    		if ("toggle" in $$props) $$invalidate(0, toggle = $$props.toggle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toggle, click_handler];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var siema_min = createCommonjsModule(function (module, exports) {
    !function(e,t){module.exports=t();}("undefined"!=typeof self?self:commonjsGlobal,function(){return function(e){function t(r){if(i[r])return i[r].exports;var n=i[r]={i:r,l:!1,exports:{}};return e[r].call(n.exports,n,n.exports,t),n.l=!0,n.exports}var i={};return t.m=e,t.c=i,t.d=function(e,i,r){t.o(e,i)||Object.defineProperty(e,i,{configurable:!1,enumerable:!0,get:r});},t.n=function(e){var i=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(i,"a",i),i},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=0)}([function(e,t,i){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},s=function(){function e(e,t){for(var i=0;i<t.length;i++){var r=t[i];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,i,r){return i&&e(t.prototype,i),r&&e(t,r),t}}(),l=function(){function e(t){var i=this;if(r(this,e),this.config=e.mergeSettings(t),this.selector="string"==typeof this.config.selector?document.querySelector(this.config.selector):this.config.selector,null===this.selector)throw new Error("Something wrong with your selector 😭");this.resolveSlidesNumber(),this.selectorWidth=this.selector.offsetWidth,this.innerElements=[].slice.call(this.selector.children),this.currentSlide=this.config.loop?this.config.startIndex%this.innerElements.length:Math.max(0,Math.min(this.config.startIndex,this.innerElements.length-this.perPage)),this.transformProperty=e.webkitOrNot(),["resizeHandler","touchstartHandler","touchendHandler","touchmoveHandler","mousedownHandler","mouseupHandler","mouseleaveHandler","mousemoveHandler","clickHandler"].forEach(function(e){i[e]=i[e].bind(i);}),this.init();}return s(e,[{key:"attachEvents",value:function(){window.addEventListener("resize",this.resizeHandler),this.config.draggable&&(this.pointerDown=!1,this.drag={startX:0,endX:0,startY:0,letItGo:null,preventClick:!1},this.selector.addEventListener("touchstart",this.touchstartHandler),this.selector.addEventListener("touchend",this.touchendHandler),this.selector.addEventListener("touchmove",this.touchmoveHandler),this.selector.addEventListener("mousedown",this.mousedownHandler),this.selector.addEventListener("mouseup",this.mouseupHandler),this.selector.addEventListener("mouseleave",this.mouseleaveHandler),this.selector.addEventListener("mousemove",this.mousemoveHandler),this.selector.addEventListener("click",this.clickHandler));}},{key:"detachEvents",value:function(){window.removeEventListener("resize",this.resizeHandler),this.selector.removeEventListener("touchstart",this.touchstartHandler),this.selector.removeEventListener("touchend",this.touchendHandler),this.selector.removeEventListener("touchmove",this.touchmoveHandler),this.selector.removeEventListener("mousedown",this.mousedownHandler),this.selector.removeEventListener("mouseup",this.mouseupHandler),this.selector.removeEventListener("mouseleave",this.mouseleaveHandler),this.selector.removeEventListener("mousemove",this.mousemoveHandler),this.selector.removeEventListener("click",this.clickHandler);}},{key:"init",value:function(){this.attachEvents(),this.selector.style.overflow="hidden",this.selector.style.direction=this.config.rtl?"rtl":"ltr",this.buildSliderFrame(),this.config.onInit.call(this);}},{key:"buildSliderFrame",value:function(){var e=this.selectorWidth/this.perPage,t=this.config.loop?this.innerElements.length+2*this.perPage:this.innerElements.length;this.sliderFrame=document.createElement("div"),this.sliderFrame.style.width=e*t+"px",this.enableTransition(),this.config.draggable&&(this.selector.style.cursor="-webkit-grab");var i=document.createDocumentFragment();if(this.config.loop)for(var r=this.innerElements.length-this.perPage;r<this.innerElements.length;r++){var n=this.buildSliderFrameItem(this.innerElements[r].cloneNode(!0));i.appendChild(n);}for(var s=0;s<this.innerElements.length;s++){var l=this.buildSliderFrameItem(this.innerElements[s]);i.appendChild(l);}if(this.config.loop)for(var o=0;o<this.perPage;o++){var a=this.buildSliderFrameItem(this.innerElements[o].cloneNode(!0));i.appendChild(a);}this.sliderFrame.appendChild(i),this.selector.innerHTML="",this.selector.appendChild(this.sliderFrame),this.slideToCurrent();}},{key:"buildSliderFrameItem",value:function(e){var t=document.createElement("div");return t.style.cssFloat=this.config.rtl?"right":"left",t.style.float=this.config.rtl?"right":"left",t.style.width=(this.config.loop?100/(this.innerElements.length+2*this.perPage):100/this.innerElements.length)+"%",t.appendChild(e),t}},{key:"resolveSlidesNumber",value:function(){if("number"==typeof this.config.perPage)this.perPage=this.config.perPage;else if("object"===n(this.config.perPage)){this.perPage=1;for(var e in this.config.perPage)window.innerWidth>=e&&(this.perPage=this.config.perPage[e]);}}},{key:"prev",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1,t=arguments[1];if(!(this.innerElements.length<=this.perPage)){var i=this.currentSlide;if(this.config.loop){if(this.currentSlide-e<0){this.disableTransition();var r=this.currentSlide+this.innerElements.length,n=this.perPage,s=r+n,l=(this.config.rtl?1:-1)*s*(this.selectorWidth/this.perPage),o=this.config.draggable?this.drag.endX-this.drag.startX:0;this.sliderFrame.style[this.transformProperty]="translate3d("+(l+o)+"px, 0, 0)",this.currentSlide=r-e;}else this.currentSlide=this.currentSlide-e;}else this.currentSlide=Math.max(this.currentSlide-e,0);i!==this.currentSlide&&(this.slideToCurrent(this.config.loop),this.config.onChange.call(this),t&&t.call(this));}}},{key:"next",value:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:1,t=arguments[1];if(!(this.innerElements.length<=this.perPage)){var i=this.currentSlide;if(this.config.loop){if(this.currentSlide+e>this.innerElements.length-this.perPage){this.disableTransition();var r=this.currentSlide-this.innerElements.length,n=this.perPage,s=r+n,l=(this.config.rtl?1:-1)*s*(this.selectorWidth/this.perPage),o=this.config.draggable?this.drag.endX-this.drag.startX:0;this.sliderFrame.style[this.transformProperty]="translate3d("+(l+o)+"px, 0, 0)",this.currentSlide=r+e;}else this.currentSlide=this.currentSlide+e;}else this.currentSlide=Math.min(this.currentSlide+e,this.innerElements.length-this.perPage);i!==this.currentSlide&&(this.slideToCurrent(this.config.loop),this.config.onChange.call(this),t&&t.call(this));}}},{key:"disableTransition",value:function(){this.sliderFrame.style.webkitTransition="all 0ms "+this.config.easing,this.sliderFrame.style.transition="all 0ms "+this.config.easing;}},{key:"enableTransition",value:function(){this.sliderFrame.style.webkitTransition="all "+this.config.duration+"ms "+this.config.easing,this.sliderFrame.style.transition="all "+this.config.duration+"ms "+this.config.easing;}},{key:"goTo",value:function(e,t){if(!(this.innerElements.length<=this.perPage)){var i=this.currentSlide;this.currentSlide=this.config.loop?e%this.innerElements.length:Math.min(Math.max(e,0),this.innerElements.length-this.perPage),i!==this.currentSlide&&(this.slideToCurrent(),this.config.onChange.call(this),t&&t.call(this));}}},{key:"slideToCurrent",value:function(e){var t=this,i=this.config.loop?this.currentSlide+this.perPage:this.currentSlide,r=(this.config.rtl?1:-1)*i*(this.selectorWidth/this.perPage);e?requestAnimationFrame(function(){requestAnimationFrame(function(){t.enableTransition(),t.sliderFrame.style[t.transformProperty]="translate3d("+r+"px, 0, 0)";});}):this.sliderFrame.style[this.transformProperty]="translate3d("+r+"px, 0, 0)";}},{key:"updateAfterDrag",value:function(){var e=(this.config.rtl?-1:1)*(this.drag.endX-this.drag.startX),t=Math.abs(e),i=this.config.multipleDrag?Math.ceil(t/(this.selectorWidth/this.perPage)):1,r=e>0&&this.currentSlide-i<0,n=e<0&&this.currentSlide+i>this.innerElements.length-this.perPage;e>0&&t>this.config.threshold&&this.innerElements.length>this.perPage?this.prev(i):e<0&&t>this.config.threshold&&this.innerElements.length>this.perPage&&this.next(i),this.slideToCurrent(r||n);}},{key:"resizeHandler",value:function(){this.resolveSlidesNumber(),this.currentSlide+this.perPage>this.innerElements.length&&(this.currentSlide=this.innerElements.length<=this.perPage?0:this.innerElements.length-this.perPage),this.selectorWidth=this.selector.offsetWidth,this.buildSliderFrame();}},{key:"clearDrag",value:function(){this.drag={startX:0,endX:0,startY:0,letItGo:null,preventClick:this.drag.preventClick};}},{key:"touchstartHandler",value:function(e){-1!==["TEXTAREA","OPTION","INPUT","SELECT"].indexOf(e.target.nodeName)||(e.stopPropagation(),this.pointerDown=!0,this.drag.startX=e.touches[0].pageX,this.drag.startY=e.touches[0].pageY);}},{key:"touchendHandler",value:function(e){e.stopPropagation(),this.pointerDown=!1,this.enableTransition(),this.drag.endX&&this.updateAfterDrag(),this.clearDrag();}},{key:"touchmoveHandler",value:function(e){if(e.stopPropagation(),null===this.drag.letItGo&&(this.drag.letItGo=Math.abs(this.drag.startY-e.touches[0].pageY)<Math.abs(this.drag.startX-e.touches[0].pageX)),this.pointerDown&&this.drag.letItGo){e.preventDefault(),this.drag.endX=e.touches[0].pageX,this.sliderFrame.style.webkitTransition="all 0ms "+this.config.easing,this.sliderFrame.style.transition="all 0ms "+this.config.easing;var t=this.config.loop?this.currentSlide+this.perPage:this.currentSlide,i=t*(this.selectorWidth/this.perPage),r=this.drag.endX-this.drag.startX,n=this.config.rtl?i+r:i-r;this.sliderFrame.style[this.transformProperty]="translate3d("+(this.config.rtl?1:-1)*n+"px, 0, 0)";}}},{key:"mousedownHandler",value:function(e){-1!==["TEXTAREA","OPTION","INPUT","SELECT"].indexOf(e.target.nodeName)||(e.preventDefault(),e.stopPropagation(),this.pointerDown=!0,this.drag.startX=e.pageX);}},{key:"mouseupHandler",value:function(e){e.stopPropagation(),this.pointerDown=!1,this.selector.style.cursor="-webkit-grab",this.enableTransition(),this.drag.endX&&this.updateAfterDrag(),this.clearDrag();}},{key:"mousemoveHandler",value:function(e){if(e.preventDefault(),this.pointerDown){"A"===e.target.nodeName&&(this.drag.preventClick=!0),this.drag.endX=e.pageX,this.selector.style.cursor="-webkit-grabbing",this.sliderFrame.style.webkitTransition="all 0ms "+this.config.easing,this.sliderFrame.style.transition="all 0ms "+this.config.easing;var t=this.config.loop?this.currentSlide+this.perPage:this.currentSlide,i=t*(this.selectorWidth/this.perPage),r=this.drag.endX-this.drag.startX,n=this.config.rtl?i+r:i-r;this.sliderFrame.style[this.transformProperty]="translate3d("+(this.config.rtl?1:-1)*n+"px, 0, 0)";}}},{key:"mouseleaveHandler",value:function(e){this.pointerDown&&(this.pointerDown=!1,this.selector.style.cursor="-webkit-grab",this.drag.endX=e.pageX,this.drag.preventClick=!1,this.enableTransition(),this.updateAfterDrag(),this.clearDrag());}},{key:"clickHandler",value:function(e){this.drag.preventClick&&e.preventDefault(),this.drag.preventClick=!1;}},{key:"remove",value:function(e,t){if(e<0||e>=this.innerElements.length)throw new Error("Item to remove doesn't exist 😭");var i=e<this.currentSlide,r=this.currentSlide+this.perPage-1===e;(i||r)&&this.currentSlide--,this.innerElements.splice(e,1),this.buildSliderFrame(),t&&t.call(this);}},{key:"insert",value:function(e,t,i){if(t<0||t>this.innerElements.length+1)throw new Error("Unable to inset it at this index 😭");if(-1!==this.innerElements.indexOf(e))throw new Error("The same item in a carousel? Really? Nope 😭");var r=t<=this.currentSlide>0&&this.innerElements.length;this.currentSlide=r?this.currentSlide+1:this.currentSlide,this.innerElements.splice(t,0,e),this.buildSliderFrame(),i&&i.call(this);}},{key:"prepend",value:function(e,t){this.insert(e,0),t&&t.call(this);}},{key:"append",value:function(e,t){this.insert(e,this.innerElements.length+1),t&&t.call(this);}},{key:"destroy",value:function(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0],t=arguments[1];if(this.detachEvents(),this.selector.style.cursor="auto",e){for(var i=document.createDocumentFragment(),r=0;r<this.innerElements.length;r++)i.appendChild(this.innerElements[r]);this.selector.innerHTML="",this.selector.appendChild(i),this.selector.removeAttribute("style");}t&&t.call(this);}}],[{key:"mergeSettings",value:function(e){var t={selector:".siema",duration:200,easing:"ease-out",perPage:1,startIndex:0,draggable:!0,multipleDrag:!0,threshold:20,loop:!1,rtl:!1,onInit:function(){},onChange:function(){}},i=e;for(var r in i)t[r]=i[r];return t}},{key:"webkitOrNot",value:function(){return "string"==typeof document.documentElement.style.transform?"transform":"WebkitTransform"}}]),e}();t.default=l,e.exports=t.default;}])});
    });

    var Siema = unwrapExports(siema_min);
    var siema_min_1 = siema_min.Siema;

    /* src\Header\Carousel.svelte generated by Svelte v3.22.2 */
    const file$1 = "src\\Header\\Carousel.svelte";
    const get_right_control_slot_changes = dirty => ({});
    const get_right_control_slot_context = ctx => ({});

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    const get_left_control_slot_changes = dirty => ({});
    const get_left_control_slot_context = ctx => ({});

    // (10:2) {#each pips as pip, i}
    function create_each_block(ctx) {
    	let li;
    	let li_class_value;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[24](/*i*/ ctx[27], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");

    			attr_dev(li, "class", li_class_value = "" + (null_to_empty(/*currentIndex*/ ctx[1] === /*i*/ ctx[27]
    			? "active"
    			: "") + " svelte-1kcdg2d"));

    			add_location(li, file$1, 10, 2, 248);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, li, anchor);
    			if (remount) dispose();
    			dispose = listen_dev(li, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*currentIndex*/ 2 && li_class_value !== (li_class_value = "" + (null_to_empty(/*currentIndex*/ ctx[1] === /*i*/ ctx[27]
    			? "active"
    			: "") + " svelte-1kcdg2d"))) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(10:2) {#each pips as pip, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let button0;
    	let t0;
    	let div0;
    	let t1;
    	let ul;
    	let t2;
    	let button1;
    	let current;
    	let dispose;
    	const left_control_slot_template = /*$$slots*/ ctx[22]["left-control"];
    	const left_control_slot = create_slot(left_control_slot_template, ctx, /*$$scope*/ ctx[21], get_left_control_slot_context);
    	const default_slot_template = /*$$slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], null);
    	let each_value = /*pips*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const right_control_slot_template = /*$$slots*/ ctx[22]["right-control"];
    	const right_control_slot = create_slot(right_control_slot_template, ctx, /*$$scope*/ ctx[21], get_right_control_slot_context);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button0 = element("button");
    			if (left_control_slot) left_control_slot.c();
    			t0 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button1 = element("button");
    			if (right_control_slot) right_control_slot.c();
    			attr_dev(button0, "class", "left svelte-1kcdg2d");
    			add_location(button0, file$1, 2, 1, 25);
    			attr_dev(div0, "class", "slides");
    			add_location(div0, file$1, 5, 1, 111);
    			set_style(ul, "--dots", /*dots*/ ctx[0] ? "flex" : "none");
    			attr_dev(ul, "class", "svelte-1kcdg2d");
    			add_location(ul, file$1, 8, 1, 175);
    			attr_dev(button1, "class", "right svelte-1kcdg2d");
    			add_location(button1, file$1, 13, 1, 342);
    			attr_dev(div1, "class", "carousel svelte-1kcdg2d");
    			add_location(div1, file$1, 1, 0, 1);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);

    			if (left_control_slot) {
    				left_control_slot.m(button0, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			/*div0_binding*/ ctx[23](div0);
    			append_dev(div1, t1);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div1, t2);
    			append_dev(div1, button1);

    			if (right_control_slot) {
    				right_control_slot.m(button1, null);
    			}

    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*left*/ ctx[4], false, false, false),
    				listen_dev(button1, "click", /*right*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (left_control_slot) {
    				if (left_control_slot.p && dirty & /*$$scope*/ 2097152) {
    					left_control_slot.p(get_slot_context(left_control_slot_template, ctx, /*$$scope*/ ctx[21], get_left_control_slot_context), get_slot_changes(left_control_slot_template, /*$$scope*/ ctx[21], dirty, get_left_control_slot_changes));
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2097152) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[21], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[21], dirty, null));
    				}
    			}

    			if (dirty & /*currentIndex, go, pips*/ 74) {
    				each_value = /*pips*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*dots*/ 1) {
    				set_style(ul, "--dots", /*dots*/ ctx[0] ? "flex" : "none");
    			}

    			if (right_control_slot) {
    				if (right_control_slot.p && dirty & /*$$scope*/ 2097152) {
    					right_control_slot.p(get_slot_context(right_control_slot_template, ctx, /*$$scope*/ ctx[21], get_right_control_slot_context), get_slot_changes(right_control_slot_template, /*$$scope*/ ctx[21], dirty, get_right_control_slot_changes));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(left_control_slot, local);
    			transition_in(default_slot, local);
    			transition_in(right_control_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(left_control_slot, local);
    			transition_out(default_slot, local);
    			transition_out(right_control_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (left_control_slot) left_control_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    			/*div0_binding*/ ctx[23](null);
    			destroy_each(each_blocks, detaching);
    			if (right_control_slot) right_control_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { perPage = 3 } = $$props;
    	let { loop = true } = $$props;
    	let { autoplay = 0 } = $$props;
    	let { duration = 200 } = $$props;
    	let { easing = "ease-out" } = $$props;
    	let { startIndex = 0 } = $$props;
    	let { draggable = true } = $$props;
    	let { multipleDrag = true } = $$props;
    	let { dots = true } = $$props;
    	let { threshold = 20 } = $$props;
    	let { rtl = false } = $$props;
    	let currentIndex = startIndex;
    	let siema;
    	let controller;
    	let timer;
    	const dispatch = createEventDispatcher();

    	onMount(() => {
    		$$invalidate(17, controller = new Siema({
    				selector: siema,
    				perPage,
    				loop,
    				duration,
    				easing,
    				startIndex,
    				draggable,
    				multipleDrag,
    				threshold,
    				rtl,
    				dots,
    				onChange: handleChange
    			}));

    		autoplay && setInterval(right, autoplay);

    		return () => {
    			autoplay && clearTimeout(timer);
    			controller.destroy();
    		};
    	});

    	function left() {
    		controller.prev();
    	}

    	function right() {
    		controller.next();
    	}

    	function go(index) {
    		controller.goTo(index);
    	}

    	function handleChange(event) {
    		$$invalidate(1, currentIndex = controller.currentSlide);

    		dispatch("change", {
    			currentSlide: controller.currentSlide,
    			slideCount: controller.innerElements.length
    		});
    	}

    	const writable_props = [
    		"perPage",
    		"loop",
    		"autoplay",
    		"duration",
    		"easing",
    		"startIndex",
    		"draggable",
    		"multipleDrag",
    		"dots",
    		"threshold",
    		"rtl"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Carousel> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Carousel", $$slots, ['left-control','default','right-control']);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, siema = $$value);
    		});
    	}

    	const click_handler = i => go(i);

    	$$self.$set = $$props => {
    		if ("perPage" in $$props) $$invalidate(7, perPage = $$props.perPage);
    		if ("loop" in $$props) $$invalidate(8, loop = $$props.loop);
    		if ("autoplay" in $$props) $$invalidate(9, autoplay = $$props.autoplay);
    		if ("duration" in $$props) $$invalidate(10, duration = $$props.duration);
    		if ("easing" in $$props) $$invalidate(11, easing = $$props.easing);
    		if ("startIndex" in $$props) $$invalidate(12, startIndex = $$props.startIndex);
    		if ("draggable" in $$props) $$invalidate(13, draggable = $$props.draggable);
    		if ("multipleDrag" in $$props) $$invalidate(14, multipleDrag = $$props.multipleDrag);
    		if ("dots" in $$props) $$invalidate(0, dots = $$props.dots);
    		if ("threshold" in $$props) $$invalidate(15, threshold = $$props.threshold);
    		if ("rtl" in $$props) $$invalidate(16, rtl = $$props.rtl);
    		if ("$$scope" in $$props) $$invalidate(21, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Siema,
    		onMount,
    		createEventDispatcher,
    		perPage,
    		loop,
    		autoplay,
    		duration,
    		easing,
    		startIndex,
    		draggable,
    		multipleDrag,
    		dots,
    		threshold,
    		rtl,
    		currentIndex,
    		siema,
    		controller,
    		timer,
    		dispatch,
    		left,
    		right,
    		go,
    		handleChange,
    		pips
    	});

    	$$self.$inject_state = $$props => {
    		if ("perPage" in $$props) $$invalidate(7, perPage = $$props.perPage);
    		if ("loop" in $$props) $$invalidate(8, loop = $$props.loop);
    		if ("autoplay" in $$props) $$invalidate(9, autoplay = $$props.autoplay);
    		if ("duration" in $$props) $$invalidate(10, duration = $$props.duration);
    		if ("easing" in $$props) $$invalidate(11, easing = $$props.easing);
    		if ("startIndex" in $$props) $$invalidate(12, startIndex = $$props.startIndex);
    		if ("draggable" in $$props) $$invalidate(13, draggable = $$props.draggable);
    		if ("multipleDrag" in $$props) $$invalidate(14, multipleDrag = $$props.multipleDrag);
    		if ("dots" in $$props) $$invalidate(0, dots = $$props.dots);
    		if ("threshold" in $$props) $$invalidate(15, threshold = $$props.threshold);
    		if ("rtl" in $$props) $$invalidate(16, rtl = $$props.rtl);
    		if ("currentIndex" in $$props) $$invalidate(1, currentIndex = $$props.currentIndex);
    		if ("siema" in $$props) $$invalidate(2, siema = $$props.siema);
    		if ("controller" in $$props) $$invalidate(17, controller = $$props.controller);
    		if ("timer" in $$props) timer = $$props.timer;
    		if ("pips" in $$props) $$invalidate(3, pips = $$props.pips);
    	};

    	let pips;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*controller*/ 131072) {
    			 $$invalidate(3, pips = controller ? controller.innerElements : []);
    		}
    	};

    	return [
    		dots,
    		currentIndex,
    		siema,
    		pips,
    		left,
    		right,
    		go,
    		perPage,
    		loop,
    		autoplay,
    		duration,
    		easing,
    		startIndex,
    		draggable,
    		multipleDrag,
    		threshold,
    		rtl,
    		controller,
    		timer,
    		dispatch,
    		handleChange,
    		$$scope,
    		$$slots,
    		div0_binding,
    		click_handler
    	];
    }

    class Carousel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			perPage: 7,
    			loop: 8,
    			autoplay: 9,
    			duration: 10,
    			easing: 11,
    			startIndex: 12,
    			draggable: 13,
    			multipleDrag: 14,
    			dots: 0,
    			threshold: 15,
    			rtl: 16
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Carousel",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get perPage() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set perPage(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loop() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loop(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoplay() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoplay(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get easing() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set easing(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startIndex() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startIndex(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get draggable() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set draggable(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multipleDrag() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multipleDrag(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dots() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dots(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get threshold() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set threshold(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rtl() {
    		throw new Error("<Carousel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rtl(value) {
    		throw new Error("<Carousel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Header\Slider.svelte generated by Svelte v3.22.2 */

    const { Object: Object_1 } = globals;
    const file$2 = "src\\Header\\Slider.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (1:0)  <script>  import Carousel from './Carousel.svelte';  let controlador=Array(2);  function pip(event){   controlador[0]=event.detail.currentSlide;   controlador[1]=event.detail.slideCount;  }
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0)  <script>  import Carousel from './Carousel.svelte';  let controlador=Array(2);  function pip(event){   controlador[0]=event.detail.currentSlide;   controlador[1]=event.detail.slideCount;  }",
    		ctx
    	});

    	return block;
    }

    // (40:27)     <Carousel autoplay={4300}
    function create_then_block(ctx) {
    	let current;

    	const carousel = new Carousel({
    			props: {
    				autoplay: 4300,
    				duration: 700,
    				perPage: 1,
    				dots: false,
    				$$slots: {
    					default: [create_default_slot],
    					"left-control": [create_left_control_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	carousel.$on("change", /*pip*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(carousel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(carousel, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const carousel_changes = {};

    			if (dirty & /*$$scope*/ 2048) {
    				carousel_changes.$$scope = { dirty, ctx };
    			}

    			carousel.$set(carousel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(carousel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(carousel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(carousel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(40:27)     <Carousel autoplay={4300}",
    		ctx
    	});

    	return block;
    }

    // (42:4) <i class="       active hidden sm:block       w-10 h-10        text-2xl text-white text-center        rounded-full        transform scale-100 transition-transform duration-300 hover:scale-150"        slot="left-control">
    function create_left_control_slot(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			i.textContent = "«";
    			attr_dev(i, "class", "\n\t\t\t\t\t\tactive hidden sm:block\n\t\t\t\t\t\tw-10 h-10 \n\t\t\t\t\t\ttext-2xl text-white text-center \n\t\t\t\t\t\trounded-full \n\t\t\t\t\t\ttransform scale-100 transition-transform duration-300 hover:scale-150 svelte-195jlh8");
    			attr_dev(i, "slot", "left-control");
    			add_location(i, file$2, 41, 4, 950);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_left_control_slot.name,
    		type: "slot",
    		source: "(42:4) <i class=\\\"       active hidden sm:block       w-10 h-10        text-2xl text-white text-center        rounded-full        transform scale-100 transition-transform duration-300 hover:scale-150\\\"        slot=\\\"left-control\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:4) {#each value as item}
    function create_each_block_1(ctx) {
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "\n\t\t\t\t\t\t\tslide \n\t\t\t\t\t\t\ttransform \n\t\t\t\t\t\t\tscale-50  \n\t\t\t\t\t\t\tsm:scale-75 \n\t\t\t\t\t\t\txl:scale-100 svelte-195jlh8");
    			if (img.src !== (img_src_value = /*item*/ ctx[8].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[8].alt);
    			add_location(img, file$2, 51, 5, 1223);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(51:4) {#each value as item}",
    		ctx
    	});

    	return block;
    }

    // (41:3) <Carousel autoplay={4300} duration={700} on:change={pip} perPage={1} dots={false}>
    function create_default_slot(ctx) {
    	let t;
    	let each_1_anchor;
    	let each_value_1 = /*value*/ ctx[7];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*slide*/ 4) {
    				each_value_1 = /*value*/ ctx[7];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(41:3) <Carousel autoplay={4300} duration={700} on:change={pip} perPage={1} dots={false}>",
    		ctx
    	});

    	return block;
    }

    // (1:0)  <script>  import Carousel from './Carousel.svelte';  let controlador=Array(2);  function pip(event){   controlador[0]=event.detail.currentSlide;   controlador[1]=event.detail.slideCount;  }
    function create_pending_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(1:0)  <script>  import Carousel from './Carousel.svelte';  let controlador=Array(2);  function pip(event){   controlador[0]=event.detail.currentSlide;   controlador[1]=event.detail.slideCount;  }",
    		ctx
    	});

    	return block;
    }

    // (74:1) {#each {length: controlador[1]} as _, i}
    function create_each_block$1(ctx) {
    	let li;
    	let li_class_value;

    	const block = {
    		c: function create() {
    			li = element("li");

    			attr_dev(li, "class", li_class_value = "\n\t\t\t\thidden sm:block \n\t\t\t\tw-5 h-5 \n\t\t\t\tmx-2 \n\t\t\t\tbg-gray-300 \n\t\t\t\trounded-full \n\t\t\t\t" + (/*controlador*/ ctx[0][0] === /*i*/ ctx[6]
    			? "active"
    			: "") + " svelte-195jlh8");

    			add_location(li, file$2, 74, 2, 1577);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*controlador*/ 1 && li_class_value !== (li_class_value = "\n\t\t\t\thidden sm:block \n\t\t\t\tw-5 h-5 \n\t\t\t\tmx-2 \n\t\t\t\tbg-gray-300 \n\t\t\t\trounded-full \n\t\t\t\t" + (/*controlador*/ ctx[0][0] === /*i*/ ctx[6]
    			? "active"
    			: "") + " svelte-195jlh8")) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(74:1) {#each {length: controlador[1]} as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let promise;
    	let t1;
    	let ul;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 7,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*slide*/ ctx[2], info);
    	let each_value = { length: /*controlador*/ ctx[0][1] };
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			info.block.c();
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img, "class", "absolute w-full h-full z-10");
    			if (img.src !== (img_src_value = "./src/img/assets/background.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$2, 28, 1, 591);
    			attr_dev(div, "class", "\n\t\t\tz-10\n\t\t\tflex slide \n\t\t\ttransform \n\t\t\ttranslate-y-5 -translate-x-4 \n\t\t\tsm:-translate-x-5 \n\t\t\txl:-translate-x-8 xl:translate-y-12 svelte-195jlh8");
    			add_location(div, file$2, 31, 1, 685);
    			attr_dev(section, "class", "\n\t\tw-full h-64 relative \n\t\tflex flex-col justify-center items-center\n\t\tmd:h-screen-1/2 md:w-1/2\n\t\txl:h-screen-3/4");
    			add_location(section, file$2, 22, 0, 457);
    			attr_dev(ul, "class", "\n\t\tblock \n\t\tw-auto h-auto \n\t\tflex flex-row justify-center \n\t\tabsolute bottom-0");
    			add_location(ul, file$2, 67, 0, 1440);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, img);
    			append_dev(section, t0);
    			append_dev(section, div);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[7] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (dirty & /*controlador*/ 1) {
    				each_value = { length: /*controlador*/ ctx[0][1] };
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function datos() {
    	let datos = [];

    	try {
    		let data = await fetch("./src/content/slide.json");
    		let resp = await data.json();
    		datos = Object.values(resp);
    		return datos;
    	} catch(err) {
    		return err;
    	}

    	
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let controlador = Array(2);

    	function pip(event) {
    		$$invalidate(0, controlador[0] = event.detail.currentSlide, controlador);
    		$$invalidate(0, controlador[1] = event.detail.slideCount, controlador);
    	}

    	let slide = datos();
    	let ir = 0;
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Slider> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Slider", $$slots, []);

    	$$self.$capture_state = () => ({
    		Carousel,
    		controlador,
    		pip,
    		slide,
    		ir,
    		datos
    	});

    	$$self.$inject_state = $$props => {
    		if ("controlador" in $$props) $$invalidate(0, controlador = $$props.controlador);
    		if ("slide" in $$props) $$invalidate(2, slide = $$props.slide);
    		if ("ir" in $$props) ir = $$props.ir;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [controlador, pip, slide];
    }

    class Slider extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slider",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Header\Boton.svelte generated by Svelte v3.22.2 */

    const file$3 = "src\\Header\\Boton.svelte";

    function create_fragment$4(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Cotizar";
    			attr_dev(a, "href", ".");
    			attr_dev(a, "download", "");
    			attr_dev(a, "class", "w-32 text-white rounded-full mt-4 p-1 px-8 border-none shadow-xl font-semibold text-xl svelte-1ynq0uz");
    			add_location(a, file$3, 1, 0, 1);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Boton> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Boton", $$slots, []);
    	return [];
    }

    class Boton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Boton",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Header\Info.svelte generated by Svelte v3.22.2 */
    const file$4 = "src\\Header\\Info.svelte";

    function create_fragment$5(ctx) {
    	let section;
    	let h2;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let current;
    	const boton = new Boton({ $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = text("Adquiere un ERP ");
    			br = element("br");
    			t1 = text(" ¡esperamos por usted!");
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Conosca el mundo de la transformación digital como nunca antes lo había visto";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Evolucione su negocio hacia la empresa inteligente";
    			t6 = space();
    			create_component(boton.$$.fragment);
    			add_location(br, file$4, 15, 19, 397);
    			attr_dev(h2, "class", "text-2xl my-4 text-center md:text-left xl:text-3xl");
    			add_location(h2, file$4, 14, 2, 314);
    			attr_dev(p0, "class", "text-center md:text-left xl:text-lg my-1");
    			add_location(p0, file$4, 17, 2, 434);
    			attr_dev(p1, "class", "text-center md:text-left xl:text-lg my-1");
    			add_location(p1, file$4, 20, 2, 576);
    			attr_dev(section, "class", "\n\t\t\tw-full h-64 \n            flex flex-col justify-center items-center\n            px-8\n            text-white sm:px-32\n\t\t\t\n\t\t\tmd:w-1/2 md:h-screen-1/2 \n\t\t\tmd:items-start md:px-20\n\t\t\t\n\t\t\txl:h-screen-3/4 xl:px-32 xl:pr-40");
    			add_location(section, file$4, 3, 1, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, t0);
    			append_dev(h2, br);
    			append_dev(h2, t1);
    			append_dev(section, t2);
    			append_dev(section, p0);
    			append_dev(section, t4);
    			append_dev(section, p1);
    			append_dev(section, t6);
    			mount_component(boton, section, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(boton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(boton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(boton);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Info> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Info", $$slots, []);
    	$$self.$capture_state = () => ({ Boton });
    	return [];
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Header\Header.svelte generated by Svelte v3.22.2 */
    const file$5 = "src\\Header\\Header.svelte";

    function create_fragment$6(ctx) {
    	let header;
    	let t;
    	let current;
    	const slider = new Slider({ $$inline: true });
    	const info = new Info({ $$inline: true });

    	const block = {
    		c: function create() {
    			header = element("header");
    			create_component(slider.$$.fragment);
    			t = space();
    			create_component(info.$$.fragment);
    			attr_dev(header, "id", "header");
    			attr_dev(header, "class", "\n        relative\n        w-full h-auto \n        flex flex-col items-center justify-center \n        py-16 \n        md:flex-row-reverse\n        lg:p-0");
    			add_location(header, file$5, 6, 0, 98);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			mount_component(slider, header, null);
    			append_dev(header, t);
    			mount_component(info, header, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slider.$$.fragment, local);
    			transition_in(info.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slider.$$.fragment, local);
    			transition_out(info.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(slider);
    			destroy_component(info);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	$$self.$capture_state = () => ({ Slider, Info });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Main\productos\Card.svelte generated by Svelte v3.22.2 */

    const file$6 = "src\\Main\\productos\\Card.svelte";

    function create_fragment$7(ctx) {
    	let article;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let section;
    	let h2;
    	let t1_value = /*datos*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let div;
    	let t3_value = /*datos*/ ctx[0].description.substring(40, -1) + "";
    	let t3;
    	let t4;
    	let dispose;

    	const block = {
    		c: function create() {
    			article = element("article");
    			img = element("img");
    			t0 = space();
    			section = element("section");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			div = element("div");
    			t3 = text(t3_value);
    			t4 = text("...");
    			attr_dev(img, "class", "w-full h-42 sm:h-full sm:w-1/2");
    			if (img.src !== (img_src_value = /*datos*/ ctx[0].img)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*datos*/ ctx[0].alt);
    			add_location(img, file$6, 87, 8, 2692);
    			attr_dev(h2, "class", "\n                        my-2 h-auto\n                        text-center \n                        text-gray-700 text-xl\n                        lg:text-xl");
    			add_location(h2, file$6, 96, 16, 2968);
    			attr_dev(div, "class", "\n                        w-full h-auto\n                        text-center\n                        text-gray-600 \n                        text-sm \n                        lg:text-sm");
    			add_location(div, file$6, 104, 16, 3208);
    			attr_dev(section, "class", "\n                flex flex-col justify-center\n                w-full h-32 max-h-full sm:h-full sm:w-1/2\n                px-4");
    			add_location(section, file$6, 91, 8, 2808);
    			attr_dev(article, "class", "\n        flex flex-col \n        w-2/3 h-64 h-auto \n        m-4\n        bg-gray-100 \n        rounded-md \n        shadow-xl\n                                                                \n        transform scale-100 shadow-xl\n        transition-transform transition-shadow duration-700 \n        hover: cursor-pointer hover:scale-105\n\n        sm:flex-row\n        sm:h-48 \n        \n        md:w-2/5\n\n        lg:h-48\n        lg:my-8\n        lg:m-1\n        \n        xl:w-1/4\n        xl:h-40");
    			add_location(article, file$6, 63, 0, 2160);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, article, anchor);
    			append_dev(article, img);
    			append_dev(article, t0);
    			append_dev(article, section);
    			append_dev(section, h2);
    			append_dev(h2, t1);
    			append_dev(section, t2);
    			append_dev(section, div);
    			append_dev(div, t3);
    			append_dev(div, t4);
    			if (remount) dispose();
    			dispose = listen_dev(article, "click", /*agregar*/ ctx[1], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*datos*/ 1 && img.src !== (img_src_value = /*datos*/ ctx[0].img)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*datos*/ 1 && img_alt_value !== (img_alt_value = /*datos*/ ctx[0].alt)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*datos*/ 1 && t1_value !== (t1_value = /*datos*/ ctx[0].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*datos*/ 1 && t3_value !== (t3_value = /*datos*/ ctx[0].description.substring(40, -1) + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function close(e) {
    	e.preventDefault();

    	if (e.target.classList[0] === "close") {
    		this.style.display = "none";
    	}

    	if (e.target.classList[0] === "archive") {
    		window.open(e.target.href, "_blank");
    	}
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { datos = {} } = $$props;

    	function agregar() {
    		let modal = document.getElementById("modal");
    		modal.style.display = "block";

    		let data = `
        <section class="
                fixed
                flex justify-center flex-wrap
                w-screen h-screen
                pt-6 top-0 left-0 
                bg-gray-800 
                z-50 
                text-white 
                overflow-scroll">
        <div class="
                close
                fixed
                left-0 top-0
                flex justify-center items-center 
                w-10 h-10 
                m-4
                bg-red-500 
                rounded-full 
                cursor-pointer 
                text-white text-3xl">
        X</div>
        <h3 class="w-full text-center text-3xl text-orange-400 ">${datos.title}</h3>
        <span class="p-6 w-full md:px-40 lg:px-64 text-center">${datos.description}</span>
        <iframe class="w-screen h-screen-1/4 md:w-1/2 md:h-video"
                src="https://www.youtube.com/embed/${datos.video.slice(-11)}?controls=0">
        </iframe>

        <h3 class="w-full m-6 text-center text-2xl text-orange-400">Beneficios:</h3>
        <ul class="p-8 md:w-2/3 xl:w-2/4">`;

    		for (let i in datos.beneficios) {
    			data += `<li class="text-left"> <i class="text-orange-400 text-2xl"> ${parseInt(i) + 1} </i>` + datos.beneficios[i] + "</li>" + "<br/>";
    		}

    		data += `</ul>
        <div class="w-full p-10 text-2xl text-center bg-orange-400">
                <a class="archive text-white" href="${datos.archive}" target="_blank">
                        Descargar mas información &laquo
                </a>    
        </div>
        </section>`;

    		modal.innerHTML = data;
    	}

    	(() => {
    		modal.addEventListener("click", close);
    	})();

    	const writable_props = ["datos"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card", $$slots, []);

    	$$self.$set = $$props => {
    		if ("datos" in $$props) $$invalidate(0, datos = $$props.datos);
    	};

    	$$self.$capture_state = () => ({ datos, agregar, close });

    	$$self.$inject_state = $$props => {
    		if ("datos" in $$props) $$invalidate(0, datos = $$props.datos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [datos, agregar];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { datos: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get datos() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set datos(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Main\productos\Cards.svelte generated by Svelte v3.22.2 */

    const { Object: Object_1$1 } = globals;
    const file$7 = "src\\Main\\productos\\Cards.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>     import Card from './Card.svelte';     import Carousel from '../../Header/Carousel.svelte';      let data = contenido();     async function contenido(){         let contenido = [];         try {             let data      = await fetch('./src/content/productos.json');             let resp      = await data.json();                 contenido = Object.values(resp);                 return contenido;         }
    function create_catch_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script>     import Card from './Card.svelte';     import Carousel from '../../Header/Carousel.svelte';      let data = contenido();     async function contenido(){         let contenido = [];         try {             let data      = await fetch('./src/content/productos.json');             let resp      = await data.json();                 contenido = Object.values(resp);                 return contenido;         }",
    		ctx
    	});

    	return block;
    }

    // (22:32)              <Carousel autoplay={4000}
    function create_then_block$1(ctx) {
    	let current;

    	const carousel = new Carousel({
    			props: {
    				autoplay: 4000,
    				perPage: { 1: 1, 768: 2, 1240: 3 },
    				dots: false,
    				$$slots: {
    					default: [create_default_slot$1],
    					"right-control": [create_right_control_slot],
    					"left-control": [create_left_control_slot$1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(carousel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(carousel, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const carousel_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				carousel_changes.$$scope = { dirty, ctx };
    			}

    			carousel.$set(carousel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(carousel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(carousel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(carousel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(22:32)              <Carousel autoplay={4000}",
    		ctx
    	});

    	return block;
    }

    // (24:16) <div class="w-10 h-10 bg-white rounded-full shadow-2xl text-2xl transform -translate-x-10 control" slot="left-control">
    function create_left_control_slot$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "«";
    			attr_dev(div, "class", "w-10 h-10 bg-white rounded-full shadow-2xl text-2xl transform -translate-x-10 control");
    			attr_dev(div, "slot", "left-control");
    			add_location(div, file$7, 23, 16, 761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_left_control_slot$1.name,
    		type: "slot",
    		source: "(24:16) <div class=\\\"w-10 h-10 bg-white rounded-full shadow-2xl text-2xl transform -translate-x-10 control\\\" slot=\\\"left-control\\\">",
    		ctx
    	});

    	return block;
    }

    // (27:16) {#each value as datos}
    function create_each_block$2(ctx) {
    	let div;
    	let current;

    	const card = new Card({
    			props: { datos: /*datos*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(card.$$.fragment);
    			attr_dev(div, "class", "w-screen mr-16");
    			add_location(div, file$7, 27, 20, 990);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(card, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(27:16) {#each value as datos}",
    		ctx
    	});

    	return block;
    }

    // (32:16) <div class="w-10 h-10 bg-white rounded-full shadow-2xl text-2xl transform -translate-x-10 control" slot="right-control">
    function create_right_control_slot(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "»";
    			attr_dev(div, "class", "w-10 h-10 bg-white rounded-full shadow-2xl text-2xl transform -translate-x-10 control");
    			attr_dev(div, "slot", "right-control");
    			add_location(div, file$7, 31, 16, 1136);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_right_control_slot.name,
    		type: "slot",
    		source: "(32:16) <div class=\\\"w-10 h-10 bg-white rounded-full shadow-2xl text-2xl transform -translate-x-10 control\\\" slot=\\\"right-control\\\">",
    		ctx
    	});

    	return block;
    }

    // (23:12) <Carousel autoplay={4000} perPage={{ 1:1, 768:2 , 1240:3 }} dots={false}>
    function create_default_slot$1(ctx) {
    	let t0;
    	let t1;
    	let current;
    	let each_value = /*value*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t1, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				each_value = /*value*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t1.parentNode, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(23:12) <Carousel autoplay={4000} perPage={{ 1:1, 768:2 , 1240:3 }} dots={false}>",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import Card from './Card.svelte';     import Carousel from '../../Header/Carousel.svelte';      let data = contenido();     async function contenido(){         let contenido = [];         try {             let data      = await fetch('./src/content/productos.json');             let resp      = await data.json();                 contenido = Object.values(resp);                 return contenido;         }
    function create_pending_block$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(1:0) <script>     import Card from './Card.svelte';     import Carousel from '../../Header/Carousel.svelte';      let data = contenido();     async function contenido(){         let contenido = [];         try {             let data      = await fetch('./src/content/productos.json');             let resp      = await data.json();                 contenido = Object.values(resp);                 return contenido;         }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let section;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 1,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*data*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			section = element("section");
    			info.block.c();
    			attr_dev(section, "class", "\n        flex justify-center flex-wrap w-screen lg:justify-evenly transform translate-x-10");
    			add_location(section, file$7, 19, 0, 517);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			info.block.m(section, info.anchor = null);
    			info.mount = () => section;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[1] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function contenido() {
    	let contenido = [];

    	try {
    		let data = await fetch("./src/content/productos.json");
    		let resp = await data.json();
    		contenido = Object.values(resp);
    		return contenido;
    	} catch(err) {
    		return resp;
    	}
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let data = contenido();
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cards> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Cards", $$slots, []);
    	$$self.$capture_state = () => ({ Card, Carousel, data, contenido });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class Cards extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cards",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Title.svelte generated by Svelte v3.22.2 */

    const file$8 = "src\\Title.svelte";

    function create_fragment$9(ctx) {
    	let section;
    	let h2;
    	let t0;
    	let t1;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			img = element("img");
    			attr_dev(h2, "class", "text-5xl text-white transform translate-x-24");
    			add_location(h2, file$8, 4, 4, 58);
    			if (img.src !== (img_src_value = "./src/img/assets/title.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$8, 7, 4, 142);
    			add_location(section, file$8, 3, 0, 44);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, t0);
    			append_dev(section, t1);
    			append_dev(section, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { title = "" } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Title", $$slots, []);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({ title });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get title() {
    		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Main\productos\Productos.svelte generated by Svelte v3.22.2 */
    const file$9 = "src\\Main\\productos\\Productos.svelte";

    function create_fragment$a(ctx) {
    	let section;
    	let t;
    	let current;

    	const title_1 = new Title({
    			props: { title: /*title*/ ctx[0] },
    			$$inline: true
    		});

    	const cards = new Cards({ $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(title_1.$$.fragment);
    			t = space();
    			create_component(cards.$$.fragment);
    			attr_dev(section, "class", "\n        w-full pt-8 overflow-hidden");
    			attr_dev(section, "id", "productos");
    			add_location(section, file$9, 6, 0, 131);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(title_1, section, null);
    			append_dev(section, t);
    			mount_component(cards, section, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title_1.$$.fragment, local);
    			transition_in(cards.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title_1.$$.fragment, local);
    			transition_out(cards.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(title_1);
    			destroy_component(cards);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let title = "Productos";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Productos> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Productos", $$slots, []);
    	$$self.$capture_state = () => ({ Cards, Title, title });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title];
    }

    class Productos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Productos",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\Main\nosotros\Nosotros.svelte generated by Svelte v3.22.2 */
    const file$a = "src\\Main\\nosotros\\Nosotros.svelte";

    function create_fragment$b(ctx) {
    	let div7;
    	let t0;
    	let div6;
    	let div1;
    	let div0;
    	let h2;
    	let t2;
    	let p0;
    	let t4;
    	let div2;
    	let t5;
    	let div5;
    	let div3;
    	let p1;
    	let t7;
    	let div4;
    	let img;
    	let img_src_value;
    	let current;

    	const title_1 = new Title({
    			props: { title: /*title*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			create_component(title_1.$$.fragment);
    			t0 = space();
    			div6 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Sistema ERP a gran medida";
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Es una solucion de software\n          de gestion empresarial\n          referencia a nivel nacional.\n          Accesible y facil de usar,\n          pensada especificamente\n          para las pequeñas y\n          medianas empresas.";
    			t4 = space();
    			div2 = element("div");
    			t5 = space();
    			div5 = element("div");
    			div3 = element("div");
    			p1 = element("p");
    			p1.textContent = "La empresa especialidad de la empresa se caracteriza en el desarrollo\n          de software a medida y aplicaciones moviles.";
    			t7 = space();
    			div4 = element("div");
    			img = element("img");
    			attr_dev(h2, "class", "text-white text-center text-4xl");
    			add_location(h2, file$a, 15, 8, 480);
    			attr_dev(p0, "class", "mt-6  text-center sm:text-left text-white");
    			add_location(p0, file$a, 18, 8, 583);
    			attr_dev(div0, "class", " m-auto sm:mr-0 lg:mr-0 w-64 h-auto ");
    			add_location(div0, file$a, 14, 6, 421);
    			attr_dev(div1, "class", "flex-1 mr-3 mt-10 w-auto h-auto ");
    			add_location(div1, file$a, 13, 4, 368);
    			attr_dev(div2, "class", "bg-white mt-24 w-2 h-56 rounded-full hidden sm:block ");
    			add_location(div2, file$a, 29, 4, 918);
    			attr_dev(p1, "class", "text-white ml-4 ");
    			add_location(p1, file$a, 32, 8, 1101);
    			attr_dev(div3, "class", "m-auto mt-16 sm:ml-0 lg:ml-0 w-64 h-auto");
    			add_location(div3, file$a, 31, 6, 1038);
    			if (img.src !== (img_src_value = /*producto*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "mt-4 ml-0 sm:ml-6 mb-2");
    			add_location(img, file$a, 38, 8, 1355);
    			attr_dev(div4, "class", "m-auto sm:ml-0 lg:ml-0 w-64 h-auto ");
    			add_location(div4, file$a, 37, 6, 1297);
    			attr_dev(div5, "class", "flex-1 ml-3 w-auto h-auto");
    			add_location(div5, file$a, 30, 4, 992);
    			attr_dev(div6, "class", " block sm:flex ");
    			add_location(div6, file$a, 12, 2, 334);
    			attr_dev(div7, "id", "nosotros");
    			attr_dev(div7, "class", "contenedor");
    			add_location(div7, file$a, 7, 0, 202);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			mount_component(title_1, div7, null);
    			append_dev(div7, t0);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(div6, t4);
    			append_dev(div6, div2);
    			append_dev(div6, t5);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, p1);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, img);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(title_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let title = "Nosotros";
    	let src = "./src/img/assets/title.svg";
    	let producto = "./src/img/assets/Productos-icon.svg";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nosotros> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Nosotros", $$slots, []);
    	$$self.$capture_state = () => ({ Title, title, src, producto });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("src" in $$props) src = $$props.src;
    		if ("producto" in $$props) $$invalidate(1, producto = $$props.producto);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, producto];
    }

    class Nosotros extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nosotros",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\Main\clientes\Cardcliente.svelte generated by Svelte v3.22.2 */

    const file$b = "src\\Main\\clientes\\Cardcliente.svelte";

    function create_fragment$c(ctx) {
    	let article;
    	let img;
    	let img_src_value;
    	let img_alt_value;

    	const block = {
    		c: function create() {
    			article = element("article");
    			img = element("img");
    			attr_dev(img, "class", "w-42 h-42 ");
    			if (img.src !== (img_src_value = /*cliente*/ ctx[0].img)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*cliente*/ ctx[0].alt);
    			add_location(img, file$b, 9, 2, 239);
    			attr_dev(article, "class", "m-2 bg-gray-100\r\n        transform scale-100 shadow-2xl\r\n        transition-transform transition-shadow duration-700 \r\n        hover: cursor-pointer hover:scale-105\r\n");
    			add_location(article, file$b, 4, 0, 51);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cliente*/ 1 && img.src !== (img_src_value = /*cliente*/ ctx[0].img)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*cliente*/ 1 && img_alt_value !== (img_alt_value = /*cliente*/ ctx[0].alt)) {
    				attr_dev(img, "alt", img_alt_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { cliente = {} } = $$props;
    	const writable_props = ["cliente"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cardcliente> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Cardcliente", $$slots, []);

    	$$self.$set = $$props => {
    		if ("cliente" in $$props) $$invalidate(0, cliente = $$props.cliente);
    	};

    	$$self.$capture_state = () => ({ cliente });

    	$$self.$inject_state = $$props => {
    		if ("cliente" in $$props) $$invalidate(0, cliente = $$props.cliente);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cliente];
    }

    class Cardcliente extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { cliente: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cardcliente",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get cliente() {
    		throw new Error("<Cardcliente>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cliente(value) {
    		throw new Error("<Cardcliente>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Main\clientes\modal.svelte generated by Svelte v3.22.2 */

    const { Object: Object_1$2 } = globals;
    const file$c = "src\\Main\\clientes\\modal.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (1:0) <script>      import Cardc from './Cardcliente.svelte';      import {createEventDispatcher}
    function create_catch_block$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$2.name,
    		type: "catch",
    		source: "(1:0) <script>      import Cardc from './Cardcliente.svelte';      import {createEventDispatcher}",
    		ctx
    	});

    	return block;
    }

    // (49:32)               {#each value as cliente,i}
    function create_then_block$2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*value*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 2) {
    				each_value = /*value*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$2.name,
    		type: "then",
    		source: "(49:32)               {#each value as cliente,i}",
    		ctx
    	});

    	return block;
    }

    // (50:12) {#each value as cliente,i}
    function create_each_block$3(ctx) {
    	let current;

    	const cardc = new Cardcliente({
    			props: { cliente: /*cliente*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cardc.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cardc, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cardc.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cardc.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cardc, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(50:12) {#each value as cliente,i}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import Cardc from './Cardcliente.svelte';      import {createEventDispatcher}
    function create_pending_block$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$2.name,
    		type: "pending",
    		source: "(1:0) <script>      import Cardc from './Cardcliente.svelte';      import {createEventDispatcher}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let section;
    	let div0;
    	let a;
    	let span;
    	let t1;
    	let div1;
    	let promise;
    	let current;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 3,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*data*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			a = element("a");
    			span = element("span");
    			span.textContent = "X";
    			t1 = space();
    			div1 = element("div");
    			info.block.c();
    			attr_dev(span, "class", "text-white");
    			add_location(span, file$c, 40, 28, 1225);
    			attr_dev(a, "href", ".");
    			add_location(a, file$c, 40, 15, 1212);
    			attr_dev(div0, "class", "\r\n                fixed\r\n                left-0 top-0\r\n                flex justify-center items-center \r\n                w-10 h-10 \r\n                m-4\r\n                bg-red-500 \r\n                rounded-full \r\n                cursor-pointer \r\n                text-white text-3xl");
    			add_location(div0, file$c, 30, 0, 860);
    			attr_dev(div1, "class", "ml-2 sm:ml-6 lg:ml-40 \r\n      mr-2 sm:mr-2 lg:mr-40 \r\n      grid  mt-12\r\n      grid-cols-3 \r\n      sm:grid-cols-3\r\n      lg:grid-cols-4 gap-2");
    			add_location(div1, file$c, 42, 0, 1274);
    			attr_dev(section, "class", "\r\n                fixed\r\n                flex justify-center flex-wrap\r\n                w-screen h-screen\r\n                pt-6 top-0 left-0 \r\n                bg-gray-800 \r\n                z-50 \r\n                text-white \r\n                overflow-scroll");
    			add_location(section, file$c, 20, 1, 582);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, a);
    			append_dev(a, span);
    			append_dev(section, t1);
    			append_dev(section, div1);
    			info.block.m(div1, info.anchor = null);
    			info.mount = () => div1;
    			info.anchor = null;
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(div0, "click", /*click_handler*/ ctx[2], false, false, false);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[3] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			info.block.d();
    			info.token = null;
    			info = null;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function contenido$1() {
    	let contenido = [];

    	try {
    		let data = await fetch("./src/content/cliente.json");
    		let resp = await data.json();
    		contenido = Object.values(resp);
    		return contenido;
    	} catch(err) {
    		return resp;
    	}
    }

    function instance$d($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let data = contenido$1();
    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Modal", $$slots, []);
    	const click_handler = () => dispatch("ver", false);

    	$$self.$capture_state = () => ({
    		Cardc: Cardcliente,
    		createEventDispatcher,
    		dispatch,
    		data,
    		contenido: contenido$1
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [dispatch, data, click_handler];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\Main\clientes\cardscliente.svelte generated by Svelte v3.22.2 */

    const { Object: Object_1$3 } = globals;

    const file$d = "src\\Main\\clientes\\cardscliente.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (1:0) <script>      import Cardc from './Cardcliente.svelte';  // modal    import Modal from './modal.svelte';    let nodal=false;      // fin modal                let data = contenido();      async function contenido(){          let contenido = [];          try {              let data      = await fetch('./src/content/cliente.json');              let resp      = await data.json();                  contenido = Object.values(resp);                  return contenido;          }
    function create_catch_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$3.name,
    		type: "catch",
    		source: "(1:0) <script>      import Cardc from './Cardcliente.svelte';  // modal    import Modal from './modal.svelte';    let nodal=false;      // fin modal                let data = contenido();      async function contenido(){          let contenido = [];          try {              let data      = await fetch('./src/content/cliente.json');              let resp      = await data.json();                  contenido = Object.values(resp);                  return contenido;          }",
    		ctx
    	});

    	return block;
    }

    // (38:32)               {#each value as cliente,i}
    function create_then_block$3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*value*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 2) {
    				each_value = /*value*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$3.name,
    		type: "then",
    		source: "(38:32)               {#each value as cliente,i}",
    		ctx
    	});

    	return block;
    }

    // (40:12) {#if i < 12}
    function create_if_block_1(ctx) {
    	let current;

    	const cardc = new Cardcliente({
    			props: { cliente: /*cliente*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cardc.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cardc, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cardc.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cardc.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cardc, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(40:12) {#if i < 12}",
    		ctx
    	});

    	return block;
    }

    // (39:12) {#each value as cliente,i}
    function create_each_block$4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*i*/ ctx[7] < 12 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*i*/ ctx[7] < 12) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(39:12) {#each value as cliente,i}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import Cardc from './Cardcliente.svelte';  // modal    import Modal from './modal.svelte';    let nodal=false;      // fin modal                let data = contenido();      async function contenido(){          let contenido = [];          try {              let data      = await fetch('./src/content/cliente.json');              let resp      = await data.json();                  contenido = Object.values(resp);                  return contenido;          }
    function create_pending_block$3(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$3.name,
    		type: "pending",
    		source: "(1:0) <script>      import Cardc from './Cardcliente.svelte';  // modal    import Modal from './modal.svelte';    let nodal=false;      // fin modal                let data = contenido();      async function contenido(){          let contenido = [];          try {              let data      = await fetch('./src/content/cliente.json');              let resp      = await data.json();                  contenido = Object.values(resp);                  return contenido;          }",
    		ctx
    	});

    	return block;
    }

    // (54:0) {#if nodal}
    function create_if_block(ctx) {
    	let current;
    	const modal = new Modal({ $$inline: true });
    	modal.$on("ver", /*ver_handler*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(54:0) {#if nodal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let section;
    	let div0;
    	let promise;
    	let t0;
    	let div1;
    	let a;
    	let t2;
    	let if_block_anchor;
    	let current;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$3,
    		then: create_then_block$3,
    		catch: create_catch_block$3,
    		value: 4,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*data*/ ctx[1], info);
    	let if_block = /*nodal*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			info.block.c();
    			t0 = space();
    			div1 = element("div");
    			a = element("a");
    			a.textContent = "Ver mas...";
    			t2 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div0, "class", "ml-2 sm:ml-6 lg:ml-40 \r\n      mr-2 sm:mr-2 lg:mr-40 \r\n      grid  \r\n      grid-cols-3 \r\n      sm:grid-cols-3\r\n      lg:grid-cols-4 gap-2");
    			add_location(div0, file$d, 30, 6, 613);
    			attr_dev(a, "href", "#modal");
    			attr_dev(a, "class", " w-32 text-white rounded-full mt-4 p-1 px-8 border-none shadow-xl font-semibold text-xl svelte-ouqkzf");
    			add_location(a, file$d, 46, 6, 1025);
    			attr_dev(div1, "class", "mt-8 text-center");
    			add_location(div1, file$d, 45, 4, 987);
    			attr_dev(section, "class", "mt-10");
    			add_location(section, file$d, 29, 0, 582);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			info.block.m(div0, info.anchor = null);
    			info.mount = () => div0;
    			info.anchor = null;
    			append_dev(section, t0);
    			append_dev(section, div1);
    			append_dev(div1, a);
    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", /*click_handler*/ ctx[2], false, false, false);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[4] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			if (/*nodal*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*nodal*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			info.block.d();
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function contenido$2() {
    	let contenido = [];

    	try {
    		let data = await fetch("./src/content/cliente.json");
    		let resp = await data.json();
    		contenido = Object.values(resp);
    		return contenido;
    	} catch(err) {
    		return resp;
    	}
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let nodal = false;

    	// fin modal
    	let data = contenido$2();

    	const writable_props = [];

    	Object_1$3.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cardscliente> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Cardscliente", $$slots, []);
    	const click_handler = () => $$invalidate(0, nodal = true);
    	const ver_handler = resp => $$invalidate(0, nodal = resp.detail);
    	$$self.$capture_state = () => ({ Cardc: Cardcliente, Modal, nodal, data, contenido: contenido$2 });

    	$$self.$inject_state = $$props => {
    		if ("nodal" in $$props) $$invalidate(0, nodal = $$props.nodal);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [nodal, data, click_handler, ver_handler];
    }

    class Cardscliente extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cardscliente",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\Main\clientes\Client.svelte generated by Svelte v3.22.2 */
    const file$e = "src\\Main\\clientes\\Client.svelte";

    function create_fragment$f(ctx) {
    	let section;
    	let t;
    	let current;

    	const title_1 = new Title({
    			props: { title: /*title*/ ctx[0] },
    			$$inline: true
    		});

    	const cardscliente = new Cardscliente({ $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(title_1.$$.fragment);
    			t = space();
    			create_component(cardscliente.$$.fragment);
    			attr_dev(section, "id", "clientes");
    			attr_dev(section, "class", "\r\n        w-full pt-8");
    			add_location(section, file$e, 8, 0, 156);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(title_1, section, null);
    			append_dev(section, t);
    			mount_component(cardscliente, section, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title_1.$$.fragment, local);
    			transition_in(cardscliente.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title_1.$$.fragment, local);
    			transition_out(cardscliente.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(title_1);
    			destroy_component(cardscliente);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let title = "Clientes";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Client> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Client", $$slots, []);
    	$$self.$capture_state = () => ({ Title, Cardscliente, title });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title];
    }

    class Client extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Client",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\Main\Main.svelte generated by Svelte v3.22.2 */
    const file$f = "src\\Main\\Main.svelte";

    function create_fragment$g(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let div;
    	let current;
    	const nosotros = new Nosotros({ $$inline: true });
    	const productos = new Productos({ $$inline: true });
    	const clientes = new Client({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nosotros.$$.fragment);
    			t0 = space();
    			create_component(productos.$$.fragment);
    			t1 = space();
    			create_component(clientes.$$.fragment);
    			t2 = space();
    			div = element("div");
    			attr_dev(div, "id", "modal");
    			add_location(div, file$f, 9, 4, 246);
    			add_location(main, file$f, 5, 0, 185);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nosotros, main, null);
    			append_dev(main, t0);
    			mount_component(productos, main, null);
    			append_dev(main, t1);
    			mount_component(clientes, main, null);
    			append_dev(main, t2);
    			append_dev(main, div);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nosotros.$$.fragment, local);
    			transition_in(productos.$$.fragment, local);
    			transition_in(clientes.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nosotros.$$.fragment, local);
    			transition_out(productos.$$.fragment, local);
    			transition_out(clientes.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nosotros);
    			destroy_component(productos);
    			destroy_component(clientes);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Main", $$slots, []);
    	$$self.$capture_state = () => ({ Productos, Nosotros, Clientes: Client });
    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\Footer\Email.svelte generated by Svelte v3.22.2 */

    const { Object: Object_1$4 } = globals;
    const file$g = "src\\Footer\\Email.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>  let codigo="+51";      let data = contenido();      async function contenido(){          let contenido = [];          try {              let data      = await fetch('./src/content/motivo.json');              let resp      = await data.json();                  contenido = Object.values(resp);                  return contenido;          }
    function create_catch_block$4(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$4.name,
    		type: "catch",
    		source: "(1:0) <script>  let codigo=\\\"+51\\\";      let data = contenido();      async function contenido(){          let contenido = [];          try {              let data      = await fetch('./src/content/motivo.json');              let resp      = await data.json();                  contenido = Object.values(resp);                  return contenido;          }",
    		ctx
    	});

    	return block;
    }

    // (83:27)               {#each opcion as motivos}
    function create_then_block$4(ctx) {
    	let each_1_anchor;
    	let each_value = /*opcion*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 2) {
    				each_value = /*opcion*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$4.name,
    		type: "then",
    		source: "(83:27)               {#each opcion as motivos}",
    		ctx
    	});

    	return block;
    }

    // (84:12) {#each opcion as motivos}
    function create_each_block$5(ctx) {
    	let option;
    	let t_value = /*motivos*/ ctx[4].motivo + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			attr_dev(option, "class", "foo svelte-qbqo55");
    			option.__value = option_value_value = /*motivos*/ ctx[4].value;
    			option.value = option.__value;
    			add_location(option, file$g, 84, 12, 2455);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(84:12) {#each opcion as motivos}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>  let codigo="+51";      let data = contenido();      async function contenido(){          let contenido = [];          try {              let data      = await fetch('./src/content/motivo.json');              let resp      = await data.json();                  contenido = Object.values(resp);                  return contenido;          }
    function create_pending_block$4(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$4.name,
    		type: "pending",
    		source: "(1:0) <script>  let codigo=\\\"+51\\\";      let data = contenido();      async function contenido(){          let contenido = [];          try {              let data      = await fetch('./src/content/motivo.json');              let resp      = await data.json();                  contenido = Object.values(resp);                  return contenido;          }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div10;
    	let form;
    	let div2;
    	let div0;
    	let input0;
    	let t0;
    	let div1;
    	let input1;
    	let t1;
    	let div6;
    	let div4;
    	let div3;
    	let select0;
    	let option;
    	let t3;
    	let input2;
    	let t4;
    	let div5;
    	let select1;
    	let promise;
    	let t5;
    	let div7;
    	let textarea;
    	let t6;
    	let div8;
    	let t7;
    	let br;
    	let t8;
    	let div9;
    	let input3;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$4,
    		then: create_then_block$4,
    		catch: create_catch_block$4,
    		value: 3
    	};

    	handle_promise(promise = /*data*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			form = element("form");
    			div2 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t1 = space();
    			div6 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			select0 = element("select");
    			option = element("option");
    			option.textContent = "PER";
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			div5 = element("div");
    			select1 = element("select");
    			info.block.c();
    			t5 = space();
    			div7 = element("div");
    			textarea = element("textarea");
    			t6 = space();
    			div8 = element("div");
    			t7 = space();
    			br = element("br");
    			t8 = space();
    			div9 = element("div");
    			input3 = element("input");
    			attr_dev(input0, "class", "   bg-transparent mr-2\r\n   focus:outline-none \r\n   focus:shadow-outline\r\n   border-b-8 \r\n    border border-gray-300\r\n     rounded-md py-2 px-4 block w-full \r\n     appearance-none leading-normal");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Nombre");
    			attr_dev(input0, "name", "nombre");
    			input0.required = true;
    			add_location(input0, file$g, 30, 3, 806);
    			attr_dev(div0, "class", "ml-2 mr-2 mb-2 w-auto sm:w-full ");
    			add_location(div0, file$g, 28, 3, 752);
    			attr_dev(input1, "class", "border-b-8 bg-transparent mr-2\r\n    focus:outline-none \r\n   focus:shadow-outline\r\n    border\r\n    border-gray-300 rounded-md \r\n    py-2 px-4 block w-full \r\n    appearance-none leading-normal");
    			attr_dev(input1, "type", "email");
    			attr_dev(input1, "placeholder", "Email");
    			input1.required = true;
    			add_location(input1, file$g, 41, 3, 1147);
    			attr_dev(div1, "class", "mr-2 ml-2 mb-2 w-auto sm:w-full");
    			add_location(div1, file$g, 40, 3, 1096);
    			attr_dev(div2, "class", " block sm:flex flex-wrap justify-center ");
    			add_location(div2, file$g, 26, 0, 691);
    			option.__value = "+51";
    			option.value = option.__value;
    			add_location(option, file$g, 60, 3, 1739);
    			attr_dev(select0, "id", "");
    			attr_dev(select0, "class", "w-full h-full border-b-8 bg-transparent\r\n    focus:outline-none focus:shadow-outline\r\n     border border-gray-300 \r\n     rounded-md py-2 px-4\r\n      block w-full appearance-none leading-normal");
    			add_location(select0, file$g, 55, 3, 1518);
    			attr_dev(div3, "class", "w-32");
    			add_location(div3, file$g, 54, 3, 1495);
    			attr_dev(input2, "name", "phone");
    			input2.value = /*codigo*/ ctx[0];
    			attr_dev(input2, "class", " border-b-8 bg-transparent \r\n    focus:outline-none\r\n     focus:shadow-outline\r\n      border border-gray-300\r\n       rounded-md py-2 px-4 \r\n       block w-full\r\n        appearance-none\r\n         leading-normal");
    			attr_dev(input2, "type", "tel");
    			attr_dev(input2, "placeholder", "Numero");
    			input2.required = true;
    			add_location(input2, file$g, 64, 3, 1807);
    			attr_dev(div4, "class", "mr-2 ml-2 mb-2 flex  ");
    			add_location(div4, file$g, 53, 2, 1455);
    			attr_dev(select1, "name", "motivo");
    			attr_dev(select1, "id", "motivo");
    			attr_dev(select1, "class", "border-b-8 bg-transparent \r\n  focus:outline-none\r\n  focus:shadow-outline \r\n  border border-gray-300 \r\n  rounded-md py-2 px-4 block \r\n  w-full appearance-none \r\n  leading-normal");
    			add_location(select1, file$g, 75, 1, 2154);
    			attr_dev(div5, "class", "mr-2 ml-2  mb-2  ");
    			add_location(div5, file$g, 74, 1, 2120);
    			add_location(div6, file$g, 52, 0, 1446);
    			attr_dev(textarea, "class", " border-b-8 bg-transparent w-full\r\n text-left  focus:outline-none\r\n  focus:shadow-outline border\r\n   border-gray-300 rounded-md py-2 \r\n   px-4 block w-auto appearance-none \r\n   leading-normal");
    			attr_dev(textarea, "placeholder", "Escribe un mensaje");
    			attr_dev(textarea, "name", "mensaje");
    			attr_dev(textarea, "id", "mensage");
    			attr_dev(textarea, "cols", "15");
    			attr_dev(textarea, "rows", "2");
    			textarea.required = true;
    			add_location(textarea, file$g, 94, 0, 2647);
    			attr_dev(div7, "class", "mr-2 ml-2 mb-2");
    			add_location(div7, file$g, 93, 0, 2616);
    			attr_dev(div8, "class", "g-recaptcha w-12 h-12");
    			attr_dev(div8, "data-sitekey", "6LfIRacZAAAAAAQ0GYOMSv-xIw5bzi1PWBDiUVnb");
    			add_location(div8, file$g, 103, 1, 2976);
    			add_location(br, file$g, 104, 6, 3081);
    			attr_dev(input3, "class", " justify-center text-xl\r\n  text-white \r\n     hover:bg-yellow-800\r\n      py-2 px-6 rounded-md\r\n      enviar svelte-qbqo55");
    			attr_dev(input3, "type", "submit");
    			input3.value = "Enviar";
    			add_location(input3, file$g, 107, 4, 3116);
    			attr_dev(div9, "class", "mt-6 ");
    			add_location(div9, file$g, 106, 0, 3090);
    			attr_dev(form, "action", /*contacto*/ ctx[2]);
    			attr_dev(form, "method", "POST");
    			add_location(form, file$g, 24, 0, 647);
    			attr_dev(div10, "class", "sm:ml-6 sm:mr-40 mt-3 text-white ");
    			add_location(div10, file$g, 22, 0, 596);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, form);
    			append_dev(form, div2);
    			append_dev(div2, div0);
    			append_dev(div0, input0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			append_dev(form, t1);
    			append_dev(form, div6);
    			append_dev(div6, div4);
    			append_dev(div4, div3);
    			append_dev(div3, select0);
    			append_dev(select0, option);
    			append_dev(div4, t3);
    			append_dev(div4, input2);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, select1);
    			info.block.m(select1, info.anchor = null);
    			info.mount = () => select1;
    			info.anchor = null;
    			append_dev(form, t5);
    			append_dev(form, div7);
    			append_dev(div7, textarea);
    			append_dev(form, t6);
    			append_dev(form, div8);
    			append_dev(form, t7);
    			append_dev(form, br);
    			append_dev(form, t8);
    			append_dev(form, div9);
    			append_dev(div9, input3);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[3] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function contenido$3() {
    	let contenido = [];

    	try {
    		let data = await fetch("./src/content/motivo.json");
    		let resp = await data.json();
    		contenido = Object.values(resp);
    		return contenido;
    	} catch(err) {
    		return resp;
    	}
    }

    function onSubmit(token) {
    	document.getElementById("demo-form").submit();
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let codigo = "+51";
    	let data = contenido$3();
    	let contacto = "https://formspree.io/xknqzree";
    	const writable_props = [];

    	Object_1$4.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Email> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Email", $$slots, []);

    	$$self.$capture_state = () => ({
    		codigo,
    		data,
    		contenido: contenido$3,
    		contacto,
    		onSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("codigo" in $$props) $$invalidate(0, codigo = $$props.codigo);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("contacto" in $$props) $$invalidate(2, contacto = $$props.contacto);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [codigo, data, contacto];
    }

    class Email extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Email",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\Footer\Estadis.svelte generated by Svelte v3.22.2 */

    const file$h = "src\\Footer\\Estadis.svelte";

    function create_fragment$i(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*foto*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$h, 5, 0, 94);
    			attr_dev(div, "class", "w-full h-auto ");
    			add_location(div, file$h, 4, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let foto = "./src/img/assets/wave.svg";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Estadis> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Estadis", $$slots, []);
    	$$self.$capture_state = () => ({ foto });

    	$$self.$inject_state = $$props => {
    		if ("foto" in $$props) $$invalidate(0, foto = $$props.foto);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [foto];
    }

    class Estadis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Estadis",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\Footer\oficina.svelte generated by Svelte v3.22.2 */

    const file$i = "src\\Footer\\oficina.svelte";

    function create_fragment$j(ctx) {
    	let div8;
    	let div7;
    	let h2;
    	let t1;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t2;
    	let p0;
    	let t3;
    	let br;
    	let t4;
    	let t5;
    	let div1;
    	let t6;
    	let div3;
    	let p1;
    	let span0;
    	let t8;
    	let t9;
    	let div4;
    	let p2;
    	let span1;
    	let t11;
    	let t12;
    	let div5;
    	let p3;
    	let span2;
    	let t14;
    	let t15;
    	let div6;
    	let p4;
    	let span3;
    	let t17;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div7 = element("div");
    			h2 = element("h2");
    			h2.textContent = "OFICINA";
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t2 = space();
    			p0 = element("p");
    			t3 = text("Jr. Alfonso Ugarte 340 ");
    			br = element("br");
    			t4 = text("\r\nSan Miguel, Lima, Peru");
    			t5 = space();
    			div1 = element("div");
    			t6 = space();
    			div3 = element("div");
    			p1 = element("p");
    			span0 = element("span");
    			span0.textContent = "►";
    			t8 = text("  Ventas: (0956) 162 194");
    			t9 = space();
    			div4 = element("div");
    			p2 = element("p");
    			span1 = element("span");
    			span1.textContent = "►";
    			t11 = text("  Renovaciones: RPC: (0956) 162 194");
    			t12 = space();
    			div5 = element("div");
    			p3 = element("p");
    			span2 = element("span");
    			span2.textContent = "►";
    			t14 = text("  Cursos y Talleres: RPC (0956) 162 194");
    			t15 = space();
    			div6 = element("div");
    			p4 = element("p");
    			span3 = element("span");
    			span3.textContent = "►";
    			t17 = text("  WhatsApp: 991-172-554");
    			attr_dev(h2, "class", "  text-3xl font-sans text-center");
    			add_location(h2, file$i, 10, 0, 148);
    			attr_dev(img, "class", "w-6 h-5 ");
    			if (img.src !== (img_src_value = /*ubicacion*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$i, 13, 0, 243);
    			attr_dev(div0, "class", "");
    			add_location(div0, file$i, 12, 0, 227);
    			add_location(br, file$i, 15, 39, 337);
    			attr_dev(p0, "class", "ml-2");
    			add_location(p0, file$i, 15, 0, 298);
    			add_location(div1, file$i, 17, 0, 372);
    			attr_dev(div2, "class", "flex");
    			add_location(div2, file$i, 11, 0, 207);
    			set_style(span0, "font-size", "20px");
    			add_location(span0, file$i, 21, 17, 434);
    			attr_dev(p1, "class", "ml-1");
    			add_location(p1, file$i, 21, 0, 417);
    			attr_dev(div3, "class", "w-auto");
    			add_location(div3, file$i, 20, 0, 395);
    			set_style(span1, "font-size", "20px");
    			add_location(span1, file$i, 24, 16, 542);
    			attr_dev(p2, "class", "ml-1");
    			add_location(p2, file$i, 24, 0, 526);
    			add_location(div4, file$i, 23, 0, 519);
    			set_style(span2, "font-size", "20px");
    			add_location(span2, file$i, 27, 16, 660);
    			attr_dev(p3, "class", "ml-1");
    			add_location(p3, file$i, 27, 0, 644);
    			add_location(div5, file$i, 26, 0, 637);
    			set_style(span3, "font-size", "20px");
    			add_location(span3, file$i, 30, 16, 782);
    			attr_dev(p4, "class", "ml-1");
    			add_location(p4, file$i, 30, 0, 766);
    			add_location(div6, file$i, 29, 0, 759);
    			attr_dev(div7, "class", "m-auto  ");
    			add_location(div7, file$i, 9, 0, 124);
    			attr_dev(div8, "class", " mr-4 ml-4 w-full text-white");
    			add_location(div8, file$i, 7, 0, 78);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, h2);
    			append_dev(div7, t1);
    			append_dev(div7, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t2);
    			append_dev(div2, p0);
    			append_dev(p0, t3);
    			append_dev(p0, br);
    			append_dev(p0, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div7, t6);
    			append_dev(div7, div3);
    			append_dev(div3, p1);
    			append_dev(p1, span0);
    			append_dev(p1, t8);
    			append_dev(div7, t9);
    			append_dev(div7, div4);
    			append_dev(div4, p2);
    			append_dev(p2, span1);
    			append_dev(p2, t11);
    			append_dev(div7, t12);
    			append_dev(div7, div5);
    			append_dev(div5, p3);
    			append_dev(p3, span2);
    			append_dev(p3, t14);
    			append_dev(div7, t15);
    			append_dev(div7, div6);
    			append_dev(div6, p4);
    			append_dev(p4, span3);
    			append_dev(p4, t17);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let ubicacion = "./src/img/assets/ubicacion.svg";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Oficina> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Oficina", $$slots, []);
    	$$self.$capture_state = () => ({ ubicacion });

    	$$self.$inject_state = $$props => {
    		if ("ubicacion" in $$props) $$invalidate(0, ubicacion = $$props.ubicacion);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ubicacion];
    }

    class Oficina extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Oficina",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\Footer\Separador.svelte generated by Svelte v3.22.2 */
    const file$j = "src\\Footer\\Separador.svelte";

    function create_fragment$k(ctx) {
    	let div2;
    	let div0;
    	let iframe;
    	let iframe_src_value;
    	let t;
    	let div1;
    	let current;
    	const oficinas = new Oficina({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			iframe = element("iframe");
    			t = space();
    			div1 = element("div");
    			create_component(oficinas.$$.fragment);
    			attr_dev(iframe, "class", "rounded-sm w-full");
    			if (iframe.src !== (iframe_src_value = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62418.383387788665!2d-77.1070309738381!3d-12.101952974089011!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105b7edfc6a8fe5%3A0x67535396ad9927e2!2sJr.%20Alfonso%20Ugarte%20340%2C%20Cercado%20de%20Lima%2015063!5e0!3m2!1ses!2spe!4v1591595893125!5m2!1ses!2spe")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "350");
    			attr_dev(iframe, "height", "300");
    			attr_dev(iframe, "frameborder", "0");
    			set_style(iframe, "border", "0");
    			iframe.allowFullscreen = "";
    			attr_dev(iframe, "aria-hidden", "false");
    			attr_dev(iframe, "tabindex", "0");
    			add_location(iframe, file$j, 7, 0, 267);
    			attr_dev(div0, "class", "w-full  rounded-sm");
    			add_location(div0, file$j, 5, 0, 147);
    			attr_dev(div1, "class", "w-full");
    			add_location(div1, file$j, 12, 0, 760);
    			attr_dev(div2, "class", "  block   md:flex");
    			add_location(div2, file$j, 4, 0, 114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, iframe);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(oficinas, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(oficinas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(oficinas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(oficinas);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let separdor = "./src/img/assets/Separacion.svg";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Separador> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Separador", $$slots, []);
    	$$self.$capture_state = () => ({ Oficinas: Oficina, separdor });

    	$$self.$inject_state = $$props => {
    		if ("separdor" in $$props) separdor = $$props.separdor;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Separador extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Separador",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\Footer\footer.svelte generated by Svelte v3.22.2 */
    const file$k = "src\\Footer\\footer.svelte";

    function create_fragment$l(ctx) {
    	let footer;
    	let t0;
    	let div0;
    	let t1;
    	let div2;
    	let div1;
    	let t2;
    	let t3;
    	let div10;
    	let div9;
    	let div8;
    	let div6;
    	let p0;
    	let t5;
    	let div3;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t6;
    	let div4;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let div5;
    	let img2;
    	let img2_src_value;
    	let t8;
    	let div7;
    	let p1;
    	let t10;
    	let a1;
    	let img3;
    	let img3_src_value;
    	let t11;
    	let div11;
    	let t12;
    	let div12;
    	let current;
    	const estadis = new Estadis({ $$inline: true });

    	const title_1 = new Title({
    			props: { title: /*title*/ ctx[0] },
    			$$inline: true
    		});

    	const separa = new Separador({ $$inline: true });
    	const email = new Email({ $$inline: true });

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			create_component(estadis.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			create_component(title_1.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			create_component(separa.$$.fragment);
    			t2 = space();
    			create_component(email.$$.fragment);
    			t3 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div6 = element("div");
    			p0 = element("p");
    			p0.textContent = "Encuéntranos en :";
    			t5 = space();
    			div3 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t6 = space();
    			div4 = element("div");
    			img1 = element("img");
    			t7 = space();
    			div5 = element("div");
    			img2 = element("img");
    			t8 = space();
    			div7 = element("div");
    			p1 = element("p");
    			p1.textContent = "COPYRIGHT © CIGE PERU S.A. - 2020";
    			t10 = space();
    			a1 = element("a");
    			img3 = element("img");
    			t11 = space();
    			div11 = element("div");
    			t12 = space();
    			div12 = element("div");
    			attr_dev(div0, "class", "foo -mt-1 w-full pt-8  svelte-1jr1ml");
    			add_location(div0, file$k, 33, 0, 1026);
    			attr_dev(div1, "class", " block sm:block lg:flex mx-auto mr-2");
    			add_location(div1, file$k, 38, 2, 1146);
    			attr_dev(div2, "class", "foo   block  sm:block lg:flex -mb-1  svelte-1jr1ml");
    			add_location(div2, file$k, 37, 0, 1093);
    			attr_dev(p0, "class", "");
    			add_location(p0, file$k, 51, 4, 1433);
    			if (img0.src !== (img0_src_value = /*facebook*/ ctx[1])) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$k, 54, 124, 1603);
    			attr_dev(a0, "href", "https://www.facebook.com/cige.erp/");
    			attr_dev(a0, "target", "_black");
    			add_location(a0, file$k, 54, 62, 1541);
    			attr_dev(div3, "class", "ml-1  w-6 h-6 rounded-full hover:bg-blue-600");
    			add_location(div3, file$k, 54, 4, 1483);
    			if (img1.src !== (img1_src_value = /*instagram*/ ctx[2])) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$k, 55, 62, 1703);
    			attr_dev(div4, "class", "ml-1 w-6  h-6 rounded-full hover:bg-pink-800");
    			add_location(div4, file$k, 55, 3, 1644);
    			if (img2.src !== (img2_src_value = /*youtube*/ ctx[3])) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$k, 56, 61, 1799);
    			attr_dev(div5, "class", "ml-1 w-6 rounded-full  h-6 hover:bg-red-600");
    			add_location(div5, file$k, 56, 3, 1741);
    			attr_dev(div6, "class", "flex  flex-1 pt-4 justify-center sm:order-1  ");
    			add_location(div6, file$k, 50, 0, 1369);
    			attr_dev(p1, "class", "pt-4 text-center sm:text-left sm:justify-start");
    			add_location(p1, file$k, 61, 0, 1867);
    			attr_dev(div7, "class", " sm:flex-1 ");
    			add_location(div7, file$k, 60, 0, 1841);
    			attr_dev(div8, "class", "block sm:flex content-end");
    			add_location(div8, file$k, 48, 0, 1328);
    			attr_dev(div9, "class", "flex-1  sm:mt-8  ");
    			add_location(div9, file$k, 47, 0, 1296);
    			attr_dev(div10, "class", "foo block sm:flex text-gray-300  svelte-1jr1ml");
    			add_location(div10, file$k, 46, 2, 1249);
    			attr_dev(img3, "class", " svelte-1jr1ml");
    			if (img3.src !== (img3_src_value = /*whatsapp*/ ctx[4])) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "");
    			add_location(img3, file$k, 70, 0, 2143);
    			attr_dev(a1, "class", "whatsapp svelte-1jr1ml");
    			attr_dev(a1, "target", "_black");
    			attr_dev(a1, "href", "https://api.whatsapp.com/send?phone=51991172554&text=Hola!%20%C2%BFC%C3%B3mo%20podemos%20ayudarte?.%20");
    			add_location(a1, file$k, 69, 0, 1996);
    			attr_dev(div11, "id", "fb-root");
    			add_location(div11, file$k, 73, 6, 2233);
    			attr_dev(div12, "class", "fb-customerchat");
    			attr_dev(div12, "attribution", "setup_tool");
    			attr_dev(div12, "page_id", "110594707260375");
    			attr_dev(div12, "theme_color", "#0084ff");
    			attr_dev(div12, "logged_in_greeting", "Hola! ¿Cómo podemos ayudarte?");
    			attr_dev(div12, "logged_out_greeting", "Hola! ¿Cómo podemos ayudarte?");
    			add_location(div12, file$k, 76, 6, 2302);
    			attr_dev(footer, "id", "contacto");
    			attr_dev(footer, "class", "w-full pt-8 ");
    			add_location(footer, file$k, 30, 0, 970);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			mount_component(estadis, footer, null);
    			append_dev(footer, t0);
    			append_dev(footer, div0);
    			mount_component(title_1, div0, null);
    			append_dev(footer, t1);
    			append_dev(footer, div2);
    			append_dev(div2, div1);
    			mount_component(separa, div1, null);
    			append_dev(div1, t2);
    			mount_component(email, div1, null);
    			append_dev(footer, t3);
    			append_dev(footer, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			append_dev(div6, p0);
    			append_dev(div6, t5);
    			append_dev(div6, div3);
    			append_dev(div3, a0);
    			append_dev(a0, img0);
    			append_dev(div6, t6);
    			append_dev(div6, div4);
    			append_dev(div4, img1);
    			append_dev(div6, t7);
    			append_dev(div6, div5);
    			append_dev(div5, img2);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div7, p1);
    			append_dev(footer, t10);
    			append_dev(footer, a1);
    			append_dev(a1, img3);
    			append_dev(footer, t11);
    			append_dev(footer, div11);
    			append_dev(footer, t12);
    			append_dev(footer, div12);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(estadis.$$.fragment, local);
    			transition_in(title_1.$$.fragment, local);
    			transition_in(separa.$$.fragment, local);
    			transition_in(email.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(estadis.$$.fragment, local);
    			transition_out(title_1.$$.fragment, local);
    			transition_out(separa.$$.fragment, local);
    			transition_out(email.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			destroy_component(estadis);
    			destroy_component(title_1);
    			destroy_component(separa);
    			destroy_component(email);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let title = "Contacto";
    	let bg_total = "bg-blue-700";
    	let facebook = "./src/img/assets/Facebook.svg";
    	let instagram = "./src/img/assets/Instagram.svg";
    	let youtube = "./src/img/assets/Youtube.svg";
    	let whatsapp = "./src/img/assets/whatsapp.svg";

    	window.fbAsyncInit = function () {
    		FB.init({ xfbml: true, version: "v7.0" });
    	};

    	(function (d, s, id) {
    		var js, fjs = d.getElementsByTagName(s)[0];
    		if (d.getElementById(id)) return;
    		js = d.createElement(s);
    		js.id = id;
    		js.src = "https://connect.facebook.net/es_ES/sdk/xfbml.customerchat.js";
    		fjs.parentNode.insertBefore(js, fjs);
    	})(document, "script", "facebook-jssdk");

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);

    	$$self.$capture_state = () => ({
    		Title,
    		Email,
    		Estadis,
    		Separa: Separador,
    		title,
    		bg_total,
    		facebook,
    		instagram,
    		youtube,
    		whatsapp
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("bg_total" in $$props) bg_total = $$props.bg_total;
    		if ("facebook" in $$props) $$invalidate(1, facebook = $$props.facebook);
    		if ("instagram" in $$props) $$invalidate(2, instagram = $$props.instagram);
    		if ("youtube" in $$props) $$invalidate(3, youtube = $$props.youtube);
    		if ("whatsapp" in $$props) $$invalidate(4, whatsapp = $$props.whatsapp);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, facebook, instagram, youtube, whatsapp];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.22.2 */
    const file$l = "src\\App.svelte";

    function create_fragment$m(ctx) {
    	let t0;
    	let main1;
    	let t1;
    	let t2;
    	let t3;
    	let current;
    	const tailwindcss = new Tailwindcss({ $$inline: true });
    	const nav = new Nav({ $$inline: true });
    	const header = new Header({ $$inline: true });
    	const main0 = new Main({ $$inline: true });
    	const footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(tailwindcss.$$.fragment);
    			t0 = space();
    			main1 = element("main");
    			create_component(nav.$$.fragment);
    			t1 = space();
    			create_component(header.$$.fragment);
    			t2 = space();
    			create_component(main0.$$.fragment);
    			t3 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(main1, "class", "static m-0 p-0 w-screen flex flex-col items-center overflow-hidden svelte-1txwxzr");
    			add_location(main1, file$l, 10, 0, 272);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tailwindcss, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main1, anchor);
    			mount_component(nav, main1, null);
    			append_dev(main1, t1);
    			mount_component(header, main1, null);
    			append_dev(main1, t2);
    			mount_component(main0, main1, null);
    			append_dev(main1, t3);
    			mount_component(footer, main1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tailwindcss.$$.fragment, local);
    			transition_in(nav.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(main0.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tailwindcss.$$.fragment, local);
    			transition_out(nav.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(main0.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tailwindcss, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main1);
    			destroy_component(nav);
    			destroy_component(header);
    			destroy_component(main0);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Tailwindcss, Nav, Header, Main, Footer });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
