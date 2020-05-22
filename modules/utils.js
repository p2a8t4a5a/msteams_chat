class Utils {
    static objectIsValid(...obj){
        return obj.every(e => e != undefined && e != null);
    }
}