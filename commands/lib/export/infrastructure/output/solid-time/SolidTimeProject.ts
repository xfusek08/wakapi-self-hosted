import Project from '../../../domain/common/ports/Project';

export default interface SolidTimeProject extends Project {
    readonly id: string;
}
